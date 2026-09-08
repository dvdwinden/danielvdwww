const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');
const metadata = require('./metadata.json');

// ============================================================================
// WEBMENTIONS
//
// Webmention is a W3C recommendation: when someone links to one of my pages
// from their own site, their site notifies mine. A static site on GitHub Pages
// can't receive a POST, so webmention.io holds the endpoint (the <link> tags
// live in webmention-head.njk) and this file pulls the collected mentions in
// at build time.
//
// See WEBMENTIONS.md for the one-time account setup this depends on.
// ============================================================================

const API_ENDPOINT = 'https://webmention.io/api/mentions.jf2';

// Mentions are collected continuously by webmention.io but only appear on the
// site when it next builds, so every build needs the full history. Fetching
// all of it every time is slow and, on a token or network failure, would
// silently publish a page with its conversation missing. So the history lives
// on disk and each build asks only for what arrived since the last one.
//
// `.cache` is already carried between CI runs by the "Cache Eleventy build"
// step in deploy.yml, so this survives on the deploy machine too.
const CACHE_DIR = '.cache';
const CACHE_FILE = path.join(CACHE_DIR, 'webmentions.json');

// The domain as registered at webmention.io. Read from metadata.json so the
// endpoint advertised in the <head> and the account queried here can't drift
// apart. The site is served from www.daniel.pizza, but webmention.io keys on
// the bare domain and matches subdomains, so mentions of either spelling
// arrive under this one account.
const DOMAIN = metadata.webmention.domain;

// webmention.io caps a page at 1000; 200 keeps each response small enough to
// parse comfortably while still needing only one request in the normal case.
const PER_PAGE = 200;

// A cap on how much of a reply is shown. Long replies are quoted up to here
// and then link out to the original — the reply belongs to its author's site,
// and this is a courtesy excerpt, not a copy.
const MAX_CONTENT_LENGTH = 500;

// The interaction types worth showing. webmention.io reports the microformats
// property that pointed at my page; anything not listed here (`bookmark-of`
// aside, which is folded in with reposts below) is either a type I don't
// render or something new, and is dropped rather than guessed at.
const REPLY_PROPERTIES = ['in-reply-to'];
const LIKE_PROPERTIES = ['like-of'];
const REPOST_PROPERTIES = ['repost-of', 'bookmark-of'];
const MENTION_PROPERTIES = ['mention-of'];

const ALL_PROPERTIES = [
  ...REPLY_PROPERTIES,
  ...LIKE_PROPERTIES,
  ...REPOST_PROPERTIES,
  ...MENTION_PROPERTIES,
];

// `--serve`/`--watch` is local dev: a missing token shouldn't take the whole
// site down over a comment section. Mirrors githubContributions.js.
const isDevServer =
  process.argv.includes('--serve') || process.argv.includes('--watch');

// ----------------------------------------------------------------------------
// SANITISING
//
// Everything below this line came from a stranger's website. It is escaped by
// Nunjucks on the way out (autoescape is on, and webmentions.njk never pipes
// any of it through `| safe`), but escaping doesn't help with a `javascript:`
// URL in an href, and it doesn't stop a 40kB "reply" from wrecking the page.
// So each field is checked here rather than trusted in the template.
// ----------------------------------------------------------------------------

// Only ever emit a URL that is plainly http(s). Anything else — `javascript:`,
// `data:`, a relative path, a malformed string — becomes null, and the
// template omits the link rather than rendering a hostile one.
function safeUrl(value) {
  if (typeof value !== 'string' || !value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.href;
  } catch (e) {
    return null;
  }
}

// Author photos are served from webmention.io's own avatar cache rather than
// hotlinked from wherever the author's site keeps them, so requiring https
// costs nothing and keeps a mixed-content warning off the page.
function safePhotoUrl(value) {
  const url = safeUrl(value);
  if (!url || !url.startsWith('https://')) return null;
  return url;
}

// Reduce a mention's content to plain text. webmention.io hands back both an
// HTML and a text rendering; the text one is used, because the alternative is
// either shipping a sanitiser dependency or trusting a stranger's markup with
// `| safe`. A quoted reply doesn't need formatting, and this way there is no
// sanitiser to get wrong.
function plainText(content) {
  if (!content) return '';

  let text =
    typeof content === 'string'
      ? content
      : typeof content.text === 'string' && content.text
        ? content.text
        // Fall back to flattening the HTML: entities are decoded after tags
        // are stripped, so an escaped "&lt;script&gt;" in the source can't be
        // turned into a real tag by this function.
        : String(content.html || '').replace(/<[^>]*>/g, ' ');

  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= MAX_CONTENT_LENGTH) {
    return text;
  }

  // Trim back to a word boundary so the excerpt doesn't end mid-word.
  const clipped = text.slice(0, MAX_CONTENT_LENGTH);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${(lastSpace > MAX_CONTENT_LENGTH * 0.6 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
}

// A display name for the author. Falls back to their domain, because an
// anonymous-looking avatar with no name at all reads as broken.
function authorName(author) {
  const name =
    author && typeof author.name === 'string' ? author.name.trim() : '';
  if (name) return name.replace(/\s+/g, ' ').slice(0, 80);

  const url = safeUrl(author && author.url);
  if (url) {
    try {
      return new URL(url).host.replace(/^www\./, '');
    } catch (e) {
      /* fall through */
    }
  }
  return 'Someone';
}

// ----------------------------------------------------------------------------
// GROUPING
// ----------------------------------------------------------------------------

// Group by path rather than by full URL. The same page can be mentioned as
// daniel.pizza/x, www.daniel.pizza/x, with a trailing slash or without, over
// http or https, or carrying a "?ref=" the linker's CMS added — all of which
// are one page as far as the reader is concerned. Reducing the target to a
// normalised path collapses them, and matches the shape of Eleventy's
// `page.url` so a template can look up its own mentions directly.
function targetPath(url) {
  const safe = safeUrl(url);
  if (!safe) return null;
  try {
    let pathname = new URL(safe).pathname;
    if (!pathname.startsWith('/')) pathname = `/${pathname}`;
    // Eleventy writes directory-style URLs, so normalise to a trailing slash.
    // The site root is already "/".
    if (!pathname.endsWith('/')) pathname = `${pathname}/`;
    return pathname;
  } catch (e) {
    return null;
  }
}

// Turn one raw JF2 entry into the shape webmentions.njk expects, or null if it
// isn't something to show.
function normalise(entry) {
  if (!entry || typeof entry !== 'object') return null;

  // Mentions marked private were sent for my eyes only. Never publish them.
  if (entry['wm-private']) return null;

  const property = entry['wm-property'];
  if (!ALL_PROPERTIES.includes(property)) return null;

  const target = targetPath(entry['wm-target']);
  if (!target) return null;

  // The source is what makes a mention verifiable — it's the page that did the
  // linking. Without a usable one there's nothing to attribute, so drop it.
  const source = safeUrl(entry.url) || safeUrl(entry['wm-source']);
  if (!source) return null;

  const author = entry.author || {};
  const published = entry.published || entry['wm-received'] || null;
  // `setZone` keeps the offset the sender published, rather than rebasing onto
  // whatever zone the build machine happens to be in. Without it a reply
  // posted late evening in Amsterdam is dated a day earlier by a UTC CI runner.
  const publishedDate = published
    ? DateTime.fromISO(published, { setZone: true })
    : null;
  const isValidDate = publishedDate && publishedDate.isValid;

  return {
    id: entry['wm-id'],
    property,
    target,
    source,
    author: {
      name: authorName(author),
      url: safeUrl(author.url),
      photo: safePhotoUrl(author.photo),
    },
    // The mention's own title, where it has one — a blog post replying to mine
    // reads better as its headline than as the first 500 characters of its body.
    title: typeof entry.name === 'string' ? plainText(entry.name).slice(0, 140) : '',
    content: plainText(entry.content),
    // ISO for <time datetime>, and a formatted copy for the reader. Formatting
    // here rather than in the template because the site's `date` filter takes a
    // JS Date and these arrive as ISO strings.
    published: isValidDate ? publishedDate.toISO() : null,
    publishedDisplay: isValidDate ? publishedDate.toFormat('d LLLL yyyy') : '',
    // Sort key. `wm-received` is when my endpoint saw it, which is the one
    // timestamp I can trust — `published` is whatever the sender claimed.
    received: entry['wm-received'] || published || null,
  };
}

// ----------------------------------------------------------------------------
// CACHE
// ----------------------------------------------------------------------------

function readCache() {
  try {
    const contents = fs.readFileSync(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(contents);
    if (parsed && Array.isArray(parsed.mentions)) return parsed;
  } catch (e) {
    // No cache yet, or an unreadable one. Either way, start clean.
  }
  return { lastFetched: null, mentions: [] };
}

function writeCache(data) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    // A cache that can't be written is a slower build, not a broken one.
    console.warn(`⚠️  Could not write ${CACHE_FILE}: ${e.message}`);
  }
}

// ----------------------------------------------------------------------------
// FETCHING
// ----------------------------------------------------------------------------

async function fetchPage(token, page, since) {
  const params = {
    domain: DOMAIN,
    token,
    'per-page': PER_PAGE,
    page,
  };
  // Ask only for what arrived after the last successful build. Note this
  // filters on when webmention.io received a mention, so a mention *deleted*
  // upstream stays in the cache — set WEBMENTIONS_REFRESH=1 to drop the cache
  // and pull the full history again.
  if (since) params.since = since;

  const response = await axios.get(API_ENDPOINT, { params, timeout: 20000 });
  const children = response.data && response.data.children;
  return Array.isArray(children) ? children : [];
}

async function fetchAll(token, since) {
  const collected = [];
  let page = 0;

  // Walk pages until one comes back short. Bounded, so a misbehaving API can't
  // spin the build forever.
  while (page < 50) {
    const batch = await fetchPage(token, page, since);
    collected.push(...batch);
    if (batch.length < PER_PAGE) break;
    page += 1;
  }

  return collected;
}

// ----------------------------------------------------------------------------

function buildResult(rawMentions, lastFetched) {
  const normalised = rawMentions
    .map(normalise)
    .filter(Boolean)
    // Oldest first: a conversation reads in the order it happened.
    .sort((a, b) => String(a.received || '').localeCompare(String(b.received || '')));

  // Keyed by the page each mention points at, so a template can ask for its
  // own and get back a ready-to-render bundle.
  const byUrl = {};
  for (const mention of normalised) {
    if (!byUrl[mention.target]) {
      byUrl[mention.target] = {
        replies: [],
        likes: [],
        reposts: [],
        mentions: [],
        total: 0,
      };
    }
    const bucket = byUrl[mention.target];

    if (REPLY_PROPERTIES.includes(mention.property)) {
      bucket.replies.push(mention);
    } else if (LIKE_PROPERTIES.includes(mention.property)) {
      bucket.likes.push(mention);
    } else if (REPOST_PROPERTIES.includes(mention.property)) {
      bucket.reposts.push(mention);
    } else {
      bucket.mentions.push(mention);
    }
    bucket.total += 1;
  }

  return {
    byUrl,
    total: normalised.length,
    lastFetched,
  };
}

module.exports = async function () {
  const cache = readCache();
  const token = process.env.WEBMENTION_IO_TOKEN;
  const refresh = Boolean(process.env.WEBMENTIONS_REFRESH);

  if (!token) {
    // Deliberately not a hard failure, even in CI. Unlike the GitHub token,
    // which guards a graph that would quietly render empty, an absent
    // webmention token means the section simply doesn't appear — and this is
    // meant to be safe to merge before the account exists.
    console.warn(
      '⚠️  WEBMENTION_IO_TOKEN is not set — building without webmentions.\n' +
        '   See WEBMENTIONS.md for the one-time setup.'
    );
    return buildResult(refresh ? [] : cache.mentions, cache.lastFetched);
  }

  const since = refresh ? null : cache.lastFetched;
  const startedAt = new Date().toISOString();

  try {
    console.log(
      since
        ? `Fetching webmentions received since ${since}...`
        : 'Fetching all webmentions...'
    );

    const fresh = await fetchAll(token, since);

    // Merge over the cache keyed on wm-id, so re-fetching an overlapping
    // window updates entries rather than duplicating them, and an edited
    // reply picks up its new text.
    const merged = new Map();
    for (const mention of refresh ? [] : cache.mentions) {
      if (mention && mention['wm-id'] !== undefined) {
        merged.set(mention['wm-id'], mention);
      }
    }
    for (const mention of fresh) {
      if (mention && mention['wm-id'] !== undefined) {
        merged.set(mention['wm-id'], mention);
      }
    }

    const mentions = [...merged.values()];
    console.log(
      `✅ ${fresh.length} new webmention${fresh.length === 1 ? '' : 's'}, ` +
        `${mentions.length} total`
    );

    writeCache({ lastFetched: startedAt, mentions });
    return buildResult(mentions, startedAt);
  } catch (error) {
    const status = error.response && error.response.status;

    // A bad token is worth shouting about — it means the section has silently
    // stopped updating — but not worth failing a deploy over, since the cache
    // still holds every mention received up to now.
    if (status === 401 || status === 403) {
      console.error(
        `❌ webmention.io rejected the token (${status}).\n` +
          '   Sign in at https://webmention.io/settings and update the\n' +
          '   WEBMENTION_IO_TOKEN secret. Serving the cached mentions instead.'
      );
      if (isDevServer) {
        console.error(
          '   Already updated .env? Restart `npm run dev` — dotenv only reads it at startup.'
        );
      }
    } else {
      console.error(`❌ Could not fetch webmentions: ${error.message}`);
      console.error('   Serving the cached mentions instead.');
    }

    // Fall back to the cache and, importantly, don't advance lastFetched — the
    // next build then asks for the same window again and nothing is lost.
    return buildResult(cache.mentions, cache.lastFetched);
  }
};
