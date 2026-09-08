#!/usr/bin/env node
'use strict';

// ============================================================================
// SEND WEBMENTIONS
//
// The other half of the protocol. src/_data/webmentions.js pulls in mentions of
// my pages; this notifies the sites *I* link to. Nearly every links post here
// points at somebody's article, and the courteous thing — the whole point of
// the protocol — is to tell them.
//
//     npm run webmentions:send -- /links/some-post/
//     npm run webmentions:send -- --latest 5
//     npm run webmentions:send -- --dry-run /journal/building-home-web/
//
// This speaks Webmention directly rather than going through a hosted sender
// (webmention.app and friends), because the protocol is small enough that the
// dependency costs more than it saves: discover the target's endpoint, POST
// two form fields, read the status code. No account, no token, no third party
// holding a list of my URLs.
//
// Run it AFTER a deploy. Links are read from the local _site build, but the
// receiving site verifies a mention by fetching the source URL itself — so the
// page has to be live, or every mention is rejected.
// ============================================================================

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const metadata = require('../src/_data/metadata.json');

const SITE_URL = metadata.url.replace(/\/$/, '');
const SITE_HOST = new URL(SITE_URL).host.replace(/^www\./, '');
const OUTPUT_DIR = '_site';

// A receiver that hasn't answered in this long isn't going to. Kept short
// because a run touches dozens of hosts and one dead domain shouldn't stall it.
const TIMEOUT = 10000;

// Identify the sender. A receiver seeing an unexplained POST is more likely to
// treat it as spam, and this gives anyone reading their logs somewhere to look.
const USER_AGENT = `daniel.pizza-webmention-sender (+${SITE_URL})`;

// ----------------------------------------------------------------------------
// FINDING PAGES AND THEIR OUTBOUND LINKS
// ----------------------------------------------------------------------------

// Map a site path to the file the build wrote for it.
function localFileFor(urlPath) {
  const clean = urlPath.replace(/^\/+|\/+$/g, '');
  return clean
    ? path.join(OUTPUT_DIR, clean, 'index.html')
    : path.join(OUTPUT_DIR, 'index.html');
}

// The N most recently dated posts, newest first, read from the built feed.
// Using the feed rather than the source directory means the permalink logic
// lives in exactly one place — Eleventy — instead of being second-guessed here.
function latestFromFeed(count) {
  const feedPath = path.join(OUTPUT_DIR, 'feed.xml');
  let xml;
  try {
    xml = fs.readFileSync(feedPath, 'utf8');
  } catch (e) {
    throw new Error(
      `Could not read ${feedPath}. Run \`npm run build\` first.`
    );
  }

  const urls = [];
  // Read <id>, not <link>. On a links post the entry's <link> points at the
  // article being linked to — someone else's site — while <id> is always the
  // canonical page here. Taking <link> would treat the external article as the
  // source of the mention, which is both wrong and unbuildable locally.
  const entryRegex = /<entry[\s\S]*?<\/entry>/g;
  let entry;
  while ((entry = entryRegex.exec(xml)) !== null && urls.length < count) {
    const id = entry[0].match(/<id>([^<]+)<\/id>/);
    if (!id) continue;
    try {
      const url = new URL(id[1].trim());
      // Belt and braces: an <id> that isn't a page on this site can't be a
      // source, whatever the feed says.
      if (url.host.replace(/^www\./, '') !== SITE_HOST) continue;
      urls.push(url.pathname);
    } catch (e) {
      /* skip a malformed entry rather than failing the run */
    }
  }
  return urls;
}

// Every outbound link on a page, deduplicated. Anchors only — an <img> or a
// stylesheet isn't a mention of anything.
function outboundLinks(html) {
  const found = new Set();

  // Drop the site's chrome first. The header, nav and footer appear on every
  // page, so leaving them in would send my own Bluesky and GitHub profiles a
  // webmention from every post on the site — dozens of notifications saying
  // nothing. A mention should come from something I actually wrote.
  const body = html
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '');

  const anchorRegex = /<a\s[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = anchorRegex.exec(body)) !== null) {
    // rel="me" marks one of my own profiles. Even inside a post, that's an
    // identity claim rather than a mention worth sending.
    const rel = match[0].match(/rel\s*=\s*["']([^"']*)["']/i);
    if (rel && /(^|\s)me(\s|$)/i.test(rel[1])) continue;

    let url;
    try {
      url = new URL(match[1], SITE_URL);
    } catch (e) {
      continue;
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;

    // Skip my own pages. Self-mentions are legitimate in the spec, but this
    // site has no use for them and they'd swamp the output — the nav and
    // footer alone are a dozen internal links on every page.
    if (url.host.replace(/^www\./, '') === SITE_HOST) continue;

    // The fragment is irrelevant to the target of a mention, and keeping it
    // would send the same host two near-identical notifications.
    url.hash = '';
    found.add(url.href);
  }

  return [...found];
}

// ----------------------------------------------------------------------------
// ENDPOINT DISCOVERY
//
// Per the spec, in order: the Link header, then <link rel="webmention">, then
// <a rel="webmention">. First one wins. The rel can carry other values
// alongside "webmention", hence matching on a word boundary rather than
// equality. The legacy "http://webmention.org/" rel is still in the wild on
// older installs, so it's accepted too.
// ----------------------------------------------------------------------------

const REL_PATTERN = /(^|\s)(webmention|http:\/\/webmention\.org\/?)(\s|$)/i;

function endpointFromLinkHeader(header) {
  if (!header) return null;
  const headers = Array.isArray(header) ? header : [header];

  for (const value of headers) {
    // Split on commas that separate link values, not commas inside <...>.
    for (const part of String(value).split(/,(?=\s*<)/)) {
      const urlMatch = part.match(/<([^>]*)>/);
      if (!urlMatch) continue;
      const relMatch = part.match(/rel\s*=\s*"?([^";]+)"?/i);
      if (relMatch && REL_PATTERN.test(relMatch[1])) {
        return urlMatch[1].trim();
      }
    }
  }
  return null;
}

function endpointFromHtml(html) {
  // <link> and <a> in document order, so the first match is the first in the
  // markup — which is what the spec asks for.
  const tagRegex = /<(link|a)\s[^>]*>/gi;
  let tag;
  while ((tag = tagRegex.exec(html)) !== null) {
    const rel = tag[0].match(/rel\s*=\s*["']([^"']*)["']/i);
    if (!rel || !REL_PATTERN.test(rel[1])) continue;
    const href = tag[0].match(/href\s*=\s*["']([^"']*)["']/i);
    // An empty href means the endpoint is the page itself, which is legal and
    // is why this returns the raw value for the caller to resolve.
    if (href) return href[1];
  }
  return null;
}

async function discoverEndpoint(target) {
  const response = await axios.get(target, {
    timeout: TIMEOUT,
    maxRedirects: 5,
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html, */*' },
    // Read the body as text; a 4xx still gets inspected, since a page behind a
    // soft error can still advertise an endpoint.
    responseType: 'text',
    validateStatus: null,
    transformResponse: [(data) => data],
  });

  // The header wins over the body, per the spec's ordering.
  const fromHeader = endpointFromLinkHeader(response.headers.link);
  const raw =
    fromHeader ||
    (typeof response.data === 'string' ? endpointFromHtml(response.data) : null);

  if (!raw) return null;

  // Resolve against the URL actually fetched, so a relative endpoint on a
  // redirected page resolves against its final location.
  const base =
    (response.request && response.request.res && response.request.res.responseUrl) ||
    target;

  try {
    const endpoint = new URL(raw, base);
    if (endpoint.protocol !== 'http:' && endpoint.protocol !== 'https:') {
      return null;
    }
    return endpoint.href;
  } catch (e) {
    return null;
  }
}

// ----------------------------------------------------------------------------
// SENDING
// ----------------------------------------------------------------------------

async function send(endpoint, source, target) {
  const body = new URLSearchParams({ source, target });

  const response = await axios.post(endpoint, body.toString(), {
    timeout: TIMEOUT,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    validateStatus: null,
  });

  // 2xx means accepted. 201/202 are the usual answers: the receiver has queued
  // the mention and will verify it by fetching the source itself.
  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
  };
}

// ----------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { paths: [], latest: 0, dryRun: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run' || arg === '-n') {
      opts.dryRun = true;
    } else if (arg === '--latest') {
      opts.latest = parseInt(argv[i + 1], 10) || 10;
      i += 1;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      // Accept a full URL or a bare path, since both are natural to paste.
      try {
        opts.paths.push(new URL(arg).pathname);
      } catch (e) {
        opts.paths.push(arg.startsWith('/') ? arg : `/${arg}`);
      }
    }
  }

  return opts;
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  let paths = opts.paths;
  if (opts.latest) {
    paths = paths.concat(latestFromFeed(opts.latest));
  }
  paths = [...new Set(paths)];

  if (!paths.length) {
    console.error(
      'Nothing to send.\n\n' +
        '  npm run webmentions:send -- /links/some-post/\n' +
        '  npm run webmentions:send -- --latest 5\n' +
        '  npm run webmentions:send -- --dry-run --latest 5\n'
    );
    process.exit(1);
  }

  if (opts.dryRun) {
    console.log('Dry run: discovering endpoints, sending nothing.\n');
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const urlPath of paths) {
    const file = localFileFor(urlPath);
    let html;
    try {
      html = fs.readFileSync(file, 'utf8');
    } catch (e) {
      console.error(`✗ ${urlPath} — no build output at ${file}`);
      failed += 1;
      continue;
    }

    const source = `${SITE_URL}${urlPath}`;
    const targets = outboundLinks(html);

    console.log(`\n${urlPath} — ${targets.length} outbound link${targets.length === 1 ? '' : 's'}`);

    for (const target of targets) {
      let endpoint;
      try {
        endpoint = await discoverEndpoint(target);
      } catch (e) {
        // Unreachable, TLS failure, timeout. Not worth a stack trace: most
        // sites simply don't support webmention and some are long gone.
        console.log(`  · ${target} — unreachable (${e.code || e.message})`);
        skipped += 1;
        continue;
      }

      if (!endpoint) {
        console.log(`  · ${target} — no endpoint`);
        skipped += 1;
        continue;
      }

      if (opts.dryRun) {
        console.log(`  → ${target}\n      would send to ${endpoint}`);
        sent += 1;
        continue;
      }

      try {
        const result = await send(endpoint, source, target);
        if (result.ok) {
          console.log(`  ✓ ${target} — accepted (${result.status})`);
          sent += 1;
        } else {
          console.log(`  ✗ ${target} — rejected (${result.status})`);
          failed += 1;
        }
      } catch (e) {
        console.log(`  ✗ ${target} — ${e.code || e.message}`);
        failed += 1;
      }
    }
  }

  console.log(
    `\n${opts.dryRun ? 'Would send' : 'Sent'} ${sent}, ` +
      `skipped ${skipped} (no endpoint), failed ${failed}.`
  );

  // A failure here is worth noticing in CI, but a site being unreachable is
  // not this site's problem — only genuine rejections set a non-zero exit.
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
