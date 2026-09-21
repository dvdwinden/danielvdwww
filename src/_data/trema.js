const axios = require('axios');

// Trema's feature images live on its own Ghost install rather than in this
// repo, so the homepage hover covers are read from its RSS feed at build time
// and keyed by post URL. A failed fetch is not worth breaking a build over:
// the template falls back to the local /assets/newsletter image.
const FEED_URL = 'https://www.trema.website/rss/';

// Ghost serves derivatives from /size/wN/format/f/ segments inserted before the
// year folder. The covers render at 186px, so w400 covers a 2x display, and
// webp takes the originals from ~260KB to ~22KB apiece.
const COVER_WIDTH = 400;

function resize(url) {
  return url.replace(
    /\/content\/images\/(?!size\/)/,
    `/content/images/size/w${COVER_WIDTH}/format/webp/`
  );
}

function decode(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .trim();
}

module.exports = async function () {
  const byUrl = {};

  try {
    const { data } = await axios.get(FEED_URL, {
      timeout: 10000,
      responseType: 'text',
      headers: { 'User-Agent': 'daniel.pizza build' }
    });

    const items = data.match(/<item>[\s\S]*?<\/item>/g) || [];

    items.forEach(item => {
      const link = item.match(/<link>([\s\S]*?)<\/link>/);
      const image = item.match(/<media:content\s+url="([^"]+)"/);
      if (!link || !image) return;
      byUrl[decode(link[1])] = resize(image[1]);
    });

    console.log(`✅ Read ${Object.keys(byUrl).length} cover images from Trema's feed`);
  } catch (error) {
    console.error(`❌ Could not read Trema's feed (${error.message})`);
    console.error('   Falling back to the local newsletter images.');
  }

  return { covers: byUrl };
};
