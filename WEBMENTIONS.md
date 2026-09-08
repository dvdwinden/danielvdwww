# Webmentions

[Webmention](https://www.w3.org/TR/webmention/) is a W3C recommendation for one
small thing: when a page links to another page, the linking site notifies the
linked one. Do it in both directions and personal sites can hold a conversation
with each other — replies, likes and reposts that live on the sites of the
people who wrote them, shown here by reference rather than owned here.

This is the implementation described in Matthias Ott's
[Into the Personal-Website-Verse](https://matthiasott.com/articles/into-the-personal-website-verse),
adapted to this site's Eleventy build.

Nothing in this branch does anything until the accounts in **Setup** exist. A
build without them succeeds and simply renders no mentions, so it is safe to
merge before you finish the setup — or to leave merged if you decide the
setup isn't worth it.

## How it fits together

Receiving is split in two, because a static site on GitHub Pages cannot accept
a POST:

| Piece | Job |
| --- | --- |
| `src/_includes/webmention-head.njk` | Advertises the endpoint. Included by both layouts. |
| [webmention.io](https://webmention.io) | Receives and verifies mentions on the site's behalf. |
| `src/_data/webmentions.js` | Pulls them in at build time, caches, sanitises, groups by page. |
| `src/_includes/webmentions.njk` | Renders them. Included by both layouts. |
| `src/css/style.css` | The `WEBMENTIONS` section. |

Sending is one script, `scripts/send-webmentions.js`, which speaks the protocol
directly — no hosted sender, no account, no token.

Identity is `rel="me"` on the profile links in `src/_includes/footer.njk`, plus
a representative `h-card` on the homepage (`src/_includes/header.njk`).

## Setup

### 1. Create the webmention.io account

Sign in at [webmention.io](https://webmention.io) **using the domain exactly as
this site is served: `www.daniel.pizza`.** It signs you in over IndieAuth: it
fetches the homepage, finds the `rel="me"` links in the footer, and asks you to
prove you control one of those profiles.

For that to work the profile has to link back. The easiest is GitHub — put
`https://www.daniel.pizza` in the website field of
[your GitHub profile](https://github.com/settings/profile). The claim is only
verifiable when it points both ways.

> **The domain string matters.** The endpoint advertised in the `<head>` and the
> account the API is queried with are both built from
> `metadata.webmention.domain` in `src/_data/metadata.json`. It is set to
> `www.daniel.pizza` to match this site's canonical URLs. If you end up signing
> in as the bare `daniel.pizza` instead, change that one value and everything
> follows.

### 2. Add the API token

Copy the API key from [webmention.io/settings](https://webmention.io/settings).

Locally, in `.env`:

```
WEBMENTION_IO_TOKEN=your-token-here
```

For deploys, add it as a repository secret named `WEBMENTION_IO_TOKEN`
(Settings → Secrets and variables → Actions). `.github/workflows/deploy.yml`
already passes it through.

### 3. Optional: bridge the social networks with Bridgy

Most replies to anything published here will happen on Bluesky, not on someone's
blog. [Brid.gy](https://brid.gy) watches a linked account and converts the
replies, likes and reposts it finds into webmentions sent to this site. Connect
Bluesky there and they start arriving alongside the rest; the display already
handles them (a Bluesky like arrives as `like-of` and lands in the facepile).

Bridgy is also how a post here gets *published* to Bluesky, but that is a
separate concern from this branch.

## Previewing it before any of that

`webmentions.sample.json` is a set of fixtures in exactly the shape the cache
uses, including two deliberately hostile entries. Copy it into place:

```bash
mkdir -p .cache && cp webmentions.sample.json .cache/webmentions.json
npm run dev
```

Then open <http://localhost:8080/journal/building-home-web/>. Leave
`WEBMENTION_IO_TOKEN` unset while doing this, or the real fetch will merge over
the fixtures. Delete `.cache/webmentions.json` when you're done.

## Sending

Run it after a deploy — the receiving site verifies a mention by fetching the
source URL itself, so the page has to be live:

```bash
npm run webmentions:send -- --dry-run --latest 5   # discover endpoints, send nothing
npm run webmentions:send -- --latest 5             # the five newest posts
npm run webmentions:send -- /links/some-post/      # one page
```

It reads the outbound links from the local `_site` build, skipping the header,
nav and footer (so your own profile links don't get a notification from every
post on the site), discovers each target's endpoint, and POSTs. Most targets
will report "no endpoint" — the great majority of the web doesn't implement
this, which is expected and not an error.

It is deliberately manual rather than wired into `deploy.yml`. Sending the same
webmention twice is harmless — receivers update rather than duplicate — but a
stateless CI job would either re-send every link on the site on every deploy or
need state of its own to avoid it, and neither is worth the complexity for
something you'll want to run a handful of times a month. Running it by hand
after publishing is the simple version. If you'd rather not think about it,
[webmention.app](https://webmention.app) will watch `/feed.xml` and send on your
behalf instead, and you can delete the script.

## Notes on the implementation

**Everything received is treated as hostile.** It is other people's text
arriving over the network and going straight onto the page. `webmentions.js`
reduces content to plain text, drops any URL that isn't plainly `http(s)`
(a `javascript:` author URL becomes no link at all), requires author photos to
be `https`, truncates at 500 characters, and discards anything marked
`wm-private`. Nothing in `webmentions.njk` uses `| safe`, so Nunjucks escapes
the rest. The last two fixtures in `webmentions.sample.json` exercise this;
they should render as visible, inert text.

**The mention history lives in `.cache/webmentions.json`** (gitignored). Each
build asks webmention.io only for what arrived since the last one and merges it
over the cache, keyed on `wm-id`. That keeps builds fast, and means a build that
can't reach webmention.io — bad token, network trouble — still renders every
mention received up to the previous one instead of silently publishing a page
with its conversation missing. A failed fetch doesn't advance the timestamp, so
nothing is lost.

The trade-off: a mention *deleted* upstream stays cached, because the `since`
filter only reports arrivals. To rebuild from scratch:

```bash
WEBMENTIONS_REFRESH=1 npm run build
```

In CI the cache rides along in the `.cache` directory already restored by the
"Cache Eleventy build" step.

**Mentions are grouped by path, not by full URL.** The same page gets linked as
`daniel.pizza/x`, `www.daniel.pizza/x`, with and without a trailing slash, and
with a `?ref=` some CMS appended. Reducing the target to a normalised path
collapses them all onto one page and matches the shape of Eleventy's `page.url`,
so `webmentions.njk` can look up its own mentions directly.

**The display renders nothing when a page has no mentions**, which is what lets
it sit in both layouts without any per-page-type gating. Set
`showWebmentions: false` in a page's frontmatter to suppress it anyway. (Not
`webmentions: false` — that name would shadow the global data.)

## Not done: `h-entry` on posts

Endpoint discovery, identity and receiving are complete. What's missing is
marking up my *own* posts with the `h-entry` microformat — `p-name` on the
title, `e-content` around the body, `dt-published` on the date. That's what
lets a site receiving a webmention *from* here show it as a titled, dated
reply rather than a bare link.

I left it out on purpose. Both layouts put the post title, body, tag list and
site footer in the same `.prose` container, so `e-content` has no element to
attach to without introducing a wrapper — and a wrapper breaks the
`.prose > *` child selectors the typography plugin relies on, which would mean
subtle spacing regressions across 179 posts. Journal posts make it worse: they
open their own prose column inside the markdown, so 23 files would need editing
too.

It's a real piece of work on the layouts rather than a class you can sprinkle
on, and it only affects how this site appears on *other* people's sites, so it
is worth doing separately and deliberately. Everything in this branch works
without it.

## Verifying it works

- [webmention.rocks](https://webmention.rocks) sends test mentions through every
  discovery method the spec allows — the fastest way to confirm the endpoint is
  advertised correctly.
- [indiewebify.me](https://indiewebify.me) checks the `rel="me"` links and the
  `h-card`.
- webmention.io's own dashboard shows what it has received and why anything was
  rejected.

One caveat on this branch: the sandbox it was built in has no outbound access to
webmention.io, matthiasott.com or the sites the sender talks to, so the data
layer, the sanitising, the display and the sender's link extraction were all
tested against fixtures and the real `_site` build, but **no live round-trip was
made against webmention.io's API**. The API shape used here is its documented
JF2 `mentions.jf2` endpoint. Worth one pass through webmention.rocks before
trusting it.
