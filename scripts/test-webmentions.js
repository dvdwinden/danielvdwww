#!/usr/bin/env node
/**
 * Tests for the webmention data layer.
 *
 * Everything here arrives over the network from strangers, so the sanitising
 * is worth pinning down: the cases below are the ones that would be
 * embarrassing (a stranger's markup on the page) or wrong (a mention attached
 * to the wrong post, a private reply published) rather than merely untidy.
 *
 * No test framework — `node scripts/test-webmentions.js`, or `npm test`.
 */

const assert = require('node:assert/strict');

const {
  safeUrl,
  safePhotoUrl,
  stripMarkup,
  plainText,
  authorName,
  authorInitial,
  targetPath,
  normalise,
  buildResult,
} = require('../src/_data/webmentions.js').internals;

let passed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed += 1;
  } catch (error) {
    failures.push({ name, error });
  }
}

// ----------------------------------------------------------------------------
// URLs

test('safeUrl keeps http and https', () => {
  assert.equal(safeUrl('https://example.com/a'), 'https://example.com/a');
  assert.equal(safeUrl('http://example.com/a'), 'http://example.com/a');
});

test('safeUrl rejects every other scheme', () => {
  for (const url of [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html;base64,PHNjcmlwdD4=',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    '',
    null,
    undefined,
    42,
    'not a url',
  ]) {
    assert.equal(safeUrl(url), null, `expected null for ${JSON.stringify(url)}`);
  }
});

test('safePhotoUrl requires https', () => {
  assert.equal(
    safePhotoUrl('https://webmention.io/avatar/a.jpg'),
    'https://webmention.io/avatar/a.jpg'
  );
  assert.equal(safePhotoUrl('http://webmention.io/avatar/a.jpg'), null);
  assert.equal(safePhotoUrl('javascript:alert(1)'), null);
});

// ----------------------------------------------------------------------------
// Markup stripping

test('stripMarkup removes tags', () => {
  assert.equal(stripMarkup('<b>bold</b> text'), 'bold text');
  assert.equal(stripMarkup('<img src=x onerror=alert(1)>'), '');
});

test('stripMarkup drops script and style contents, not just their tags', () => {
  assert.equal(stripMarkup("a <script>alert('xss')</script> b"), 'a b');
  assert.equal(stripMarkup('a <style>body{display:none}</style> b'), 'a b');
  // An unclosed script would otherwise leak its whole tail onto the page.
  assert.equal(stripMarkup("a <script>alert('xss')"), 'a');
});

test('stripMarkup survives encoded and double-encoded markup', () => {
  assert.equal(stripMarkup('&lt;script&gt;alert(1)&lt;/script&gt;'), '');
  assert.equal(
    stripMarkup('&amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt;'),
    ''
  );
  assert.equal(stripMarkup('&lt;b&gt;shouty&lt;/b&gt;'), 'shouty');
});

test('stripMarkup decodes the entities a reader should see', () => {
  assert.equal(stripMarkup('Tom &amp; Jerry'), 'Tom & Jerry');
  assert.equal(stripMarkup('one&nbsp;two'), 'one two');
  assert.equal(stripMarkup('&quot;quoted&quot;'), '"quoted"');
});

test('stripMarkup collapses whitespace and handles non-strings', () => {
  assert.equal(stripMarkup('  a\n\n  b  '), 'a b');
  assert.equal(stripMarkup(null), '');
  assert.equal(stripMarkup(undefined), '');
  assert.equal(stripMarkup({}), '[object Object]');
});

test('plainText prefers the text rendering but still strips it', () => {
  assert.equal(
    plainText({ text: 'plain <b>enough</b>', html: '<p>ignored</p>' }),
    'plain enough'
  );
  assert.equal(plainText({ html: '<p>from <em>html</em></p>' }), 'from html');
  assert.equal(plainText(''), '');
  assert.equal(plainText(null), '');
});

test('plainText truncates long content on a word boundary', () => {
  const long = 'word '.repeat(300).trim();
  const out = plainText(long);
  assert.ok(out.length <= 501, `expected <=501 chars, got ${out.length}`);
  assert.ok(out.endsWith('…'), 'expected an ellipsis');
  assert.ok(!out.endsWith('wor…'), 'expected no mid-word cut');
});

test('plainText leaves short content alone', () => {
  assert.equal(plainText({ text: 'Short reply.' }), 'Short reply.');
});

// ----------------------------------------------------------------------------
// Author names

test('authorName strips markup and falls back to the domain', () => {
  assert.equal(authorName({ name: 'Marijke de Vries' }), 'Marijke de Vries');
  assert.equal(
    authorName({ name: '<img src=x onerror=alert(1)>', url: 'https://hostile.example/a' }),
    'hostile.example'
  );
  assert.equal(
    authorName({ name: '   ', url: 'https://www.example.com/a' }),
    'example.com',
    'www. should be dropped'
  );
});

test('authorName falls back to Someone when there is nothing usable', () => {
  assert.equal(authorName({}), 'Someone');
  assert.equal(authorName(null), 'Someone');
  assert.equal(authorName({ name: '<b></b>', url: 'javascript:alert(1)' }), 'Someone');
});

test('authorName caps a very long name', () => {
  const name = authorName({ name: 'Ann '.repeat(60) });
  assert.ok(name.length <= 80, `expected <=80 chars, got ${name.length}`);
});

test('authorInitial steps over emoji and punctuation', () => {
  assert.equal(authorInitial('Marijke de Vries'), 'M');
  // Nunjucks' `first` would return half a surrogate pair here.
  assert.equal(authorInitial('🌱 Emoji Person 🌱'), 'E');
  assert.equal(authorInitial('“Quoted” Name'), 'Q');
  assert.equal(authorInitial('محمد العربي'), 'م');
  assert.equal(authorInitial('4chan'), '4');
  assert.equal(authorInitial('🌱🌊'), '', 'an all-emoji name gets an empty disc');
  assert.equal(authorInitial(''), '');
  assert.equal(authorInitial(null), '');
});

// ----------------------------------------------------------------------------
// Target paths

test('targetPath collapses the many spellings of one page', () => {
  const expected = '/journal/a-post/';
  for (const url of [
    'https://daniel.pizza/journal/a-post/',
    'https://www.daniel.pizza/journal/a-post',
    'http://daniel.pizza/journal/a-post',
    'https://daniel.pizza/journal/a-post/?ref=someones-cms',
    'https://daniel.pizza/journal/a-post/#a-heading',
  ]) {
    assert.equal(targetPath(url), expected, `for ${url}`);
  }
});

test('targetPath handles the site root and rejects junk', () => {
  assert.equal(targetPath('https://daniel.pizza/'), '/');
  assert.equal(targetPath('https://daniel.pizza'), '/');
  assert.equal(targetPath('javascript:alert(1)'), null);
  assert.equal(targetPath(''), null);
});

// ----------------------------------------------------------------------------
// Normalising entries

const entry = (overrides = {}) => ({
  'wm-id': 1,
  'wm-property': 'in-reply-to',
  'wm-target': 'https://www.daniel.pizza/journal/a-post/',
  'wm-received': '2026-03-02T09:12:00+01:00',
  url: 'https://elsewhere.example/reply',
  published: '2026-03-02T09:12:00+01:00',
  author: { name: 'Someone Else', url: 'https://elsewhere.example' },
  content: { text: 'A reply.' },
  ...overrides,
});

test('normalise drops private mentions', () => {
  assert.equal(normalise(entry({ 'wm-private': true })), null);
});

test('normalise drops entries with no usable source or target', () => {
  assert.equal(normalise(entry({ url: null, 'wm-source': null })), null);
  assert.equal(normalise(entry({ 'wm-target': 'javascript:alert(1)' })), null);
  assert.equal(normalise(entry({ url: 'javascript:alert(1)', 'wm-source': null })), null);
});

test('normalise drops unknown properties and non-objects', () => {
  assert.equal(normalise(entry({ 'wm-property': 'bookmark-of-something' })), null);
  assert.equal(normalise(null), null);
  assert.equal(normalise('a string'), null);
});

test('normalise keeps the sender timezone rather than the build machine one', () => {
  const out = normalise(entry({ published: '2026-03-02T23:30:00+01:00' }));
  assert.equal(out.publishedDisplay, 'March 2, 2026');
  assert.ok(out.published.startsWith('2026-03-02T23:30'), out.published);
});

test('normalise survives an unparseable date', () => {
  const out = normalise(entry({ published: 'last tuesday', 'wm-received': null }));
  assert.equal(out.published, null);
  assert.equal(out.publishedDisplay, '');
});

test('normalise rejects an http author photo but keeps the mention', () => {
  const out = normalise(
    entry({ author: { name: 'A', photo: 'http://insecure.example/a.jpg' } })
  );
  assert.equal(out.author.photo, null);
  assert.equal(out.author.name, 'A');
});

test('normalise caps a very long title', () => {
  const out = normalise(entry({ name: 'Title '.repeat(60) }));
  assert.ok(out.title.length <= 140, `expected <=140 chars, got ${out.title.length}`);
});

test('normalise carries an initial alongside the name', () => {
  const out = normalise(entry({ author: { name: '🌱 Emoji Person' } }));
  assert.equal(out.author.initial, 'E');
  assert.equal(out.author.name, '🌱 Emoji Person');
});

// ----------------------------------------------------------------------------
// Grouping

test('buildResult buckets by type and groups by page', () => {
  const result = buildResult(
    [
      entry({ 'wm-id': 1, 'wm-property': 'in-reply-to' }),
      entry({ 'wm-id': 2, 'wm-property': 'like-of' }),
      entry({ 'wm-id': 3, 'wm-property': 'repost-of' }),
      entry({ 'wm-id': 4, 'wm-property': 'mention-of' }),
      entry({
        'wm-id': 5,
        'wm-property': 'in-reply-to',
        'wm-target': 'https://daniel.pizza/links/other/',
      }),
    ],
    '2026-03-06T00:00:00Z'
  );

  const post = result.byUrl['/journal/a-post/'];
  assert.equal(post.replies.length, 1);
  assert.equal(post.likes.length, 1);
  assert.equal(post.reposts.length, 1);
  assert.equal(post.mentions.length, 1);
  assert.equal(post.total, 4);
  assert.equal(result.byUrl['/links/other/'].total, 1);
  assert.equal(result.total, 5);
  assert.equal(result.lastFetched, '2026-03-06T00:00:00Z');
});

test('buildResult sorts a conversation oldest first', () => {
  const result = buildResult(
    [
      entry({ 'wm-id': 1, 'wm-received': '2026-03-05T00:00:00Z', content: { text: 'second' } }),
      entry({ 'wm-id': 2, 'wm-received': '2026-03-01T00:00:00Z', content: { text: 'first' } }),
    ],
    null
  );
  const replies = result.byUrl['/journal/a-post/'].replies;
  assert.deepEqual(
    replies.map((r) => r.content),
    ['first', 'second']
  );
});

test('buildResult on nothing is an empty, safe shape', () => {
  const result = buildResult([], null);
  assert.deepEqual(result.byUrl, {});
  assert.equal(result.total, 0);
  // The template gates on `wm and wm.total`, so an unmentioned page must be
  // undefined here rather than an empty bucket that renders a bare heading.
  assert.equal(result.byUrl['/journal/a-post/'], undefined);
});

// ----------------------------------------------------------------------------

for (const { name, error } of failures) {
  console.error(`✗ ${name}\n  ${error.message.split('\n').join('\n  ')}\n`);
}
console.log(
  `${passed} passed, ${failures.length} failed (${passed + failures.length} total)`
);
process.exit(failures.length ? 1 : 0);
