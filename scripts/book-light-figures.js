// Renders the figures for the “Lighting Trema’s books” journal post.
//
// Each scene is a small HTML page: the cover cutouts from src/assets/newsletter
// on the page colour, lit with the same drop-shadow filter the site uses for
// its Library and Newsletter covers. Headless Chrome screenshots it at 2x, so
// the PNGs are 2880px wide and stay sharp on a large retina display.
//
// The ground is transparent: the images carry only the covers and their light,
// and the page shows through. That way the figure never sits in a box of a
// slightly different colour (lossy WebP shifts a flat ground by a level, which
// reads as a frame in dark mode), and the shadows live in the alpha channel,
// which WebP keeps lossless, and is dithered so it doesn't band. The post's
// own CSS draws the light-mode panel around some of them (see BOOK LIGHT
// FIGURES in src/css/style.css).
//
//   node scripts/book-light-figures.js            # all scenes
//   node scripts/book-light-figures.js 11 15      # by number
//   node scripts/book-light-figures.js layers     # the animation only

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'src/assets/journal');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// The page serves the stills at up to 2400px (retinaImage at 1200, 2x), so
// that's the size they're rendered at. The animation is served as-is, so it
// stays at 1x to keep its weight down.
const SCALE = 2400 / 1440;
const ANIMATION_SCALE = 1;

// The site's Book light colours (style.css, BOOK LIGHT)
const LIGHT = {
  light: { glow: 'rgba(255, 255, 255, 0.5)', core: 'rgba(40, 40, 40, 0.18)', tail: 'rgba(40, 40, 40, 0.28)' },
  dark: { glow: 'rgba(255, 255, 255, 0.06)', core: 'rgba(0, 0, 0, 0.4)', tail: 'rgba(0, 0, 0, 0.55)' },
};

const COVERS = {
  doom: 'chronicles-of-doom.webp',
  'memory-police': 'the-memory-police.png',
  'wild-birds': 'wendell-berry-the-wild-birds.png',
  greyhound: 'greyhound.png',
  frog: 'anne-fadiman-frog.png',
};

const DIMS = {}; // trimmed cover sizes, filled in by main()

const W = 1440;
const H = 960;
const COVER = 350; // the cover's width on a 1440 canvas

// One cover with a given light. `w` is the rendered width; every shadow is a
// share of it, as on the site.
function cover(name, light, mode, w = COVER, extra = '') {
  const c = LIGHT[mode];
  const filters = {
    none: 'none',
    // The generic tutorial shadow: a few soft layers, bigger and fainter each time
    generic: `drop-shadow(0.5em 0.5em 0.5em rgba(0,0,0,0.08))
              drop-shadow(1.5em 1.5em 1.5em rgba(0,0,0,0.06))
              drop-shadow(3.5em 4em 5em rgba(0,0,0,0.04))
              drop-shadow(8em 10em 15em rgba(0,0,0,0.03))`,
    // One shadow, tinted to the surface underneath
    tinted: mode === 'dark'
      ? 'drop-shadow(14.79em 11.63em 14em rgba(0,0,0,0.6))'
      : 'drop-shadow(14.79em 11.63em 14em rgba(72, 66, 54, 0.38))',
    // Three of the sun explorations
    hard: `drop-shadow(9em 7em 0.6em rgba(0,0,0,${mode === 'dark' ? 0.7 : 0.4}))`,
    high: `drop-shadow(1.5em 5em 2.5em rgba(0,0,0,${mode === 'dark' ? 0.65 : 0.35}))`,
    evening: mode === 'dark'
      ? 'drop-shadow(28em 17em 7em rgba(0,0,0,0.6))'
      : 'drop-shadow(28em 17em 7em rgba(96, 70, 40, 0.38))',
    // Book light: the glow, the core and the tail
    book: `drop-shadow(-3.5em -4.25em 5.5em ${c.glow})
           drop-shadow(9.36em 8.11em 3.96em ${c.core})
           drop-shadow(14.79em 11.63em 14em ${c.tail})`,
  };
  return `<img src="covers/${name}.png" style="width:${w}px;font-size:${w / 100}px;filter:${filters[light]};${extra}">`;
}

const divider = (mode) => mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)';

// Every scene returns { width, height, body }
const SCENES = {
  '01-02-no-light-generic': (mode) => ({
    body: `<div class="two-up">${cover('doom', 'none', mode)}<i style="background:${divider(mode)}"></i>${cover('doom', 'generic', mode)}</div>`,
  }),
  '03-tinted-shadow': (mode) => ({
    body: `<div class="centre">${cover('doom', 'tinted', mode)}</div>`,
  }),
  // Three of the Figma lighting explorations, redrawn: a hard sun, a higher
  // sun and a low evening sun
  '04-three-suns': (mode) => ({
    body: `<div class="row">
      ${cover('doom', 'hard', mode, 260)}${cover('doom', 'high', mode, 260)}${cover('doom', 'evening', mode, 260)}
    </div>`,
  }),
  // The three effect styles in Figma, cut out of screenshots (scripts/book-light-assets)
  '13-figma-styles': (mode) => ({
    body: `<div class="row" style="align-items:flex-start;padding-top:60px;gap:56px">
      ${['thin', 'slim', 'thick'].map((n) => `<img src="file://${ROOT}/scripts/book-light-assets/figma-dialog-${n}.png" style="width:390px;filter:drop-shadow(0 10px 30px rgba(0,0,0,${mode === 'dark' ? 0.5 : 0.18}))">`).join('')}
    </div>`,
  }),
  // The dark-mode figure is the same scene in both colour schemes
  '09-dark': () => ({
        body: `<div class="centre">${cover('doom', 'book', 'dark')}</div>`,
  }),
  // Safari's mistake, simulated: the shadow clipped to a box around the cover.
  // A tighter canvas, since this one sits in the text column.
  '10-safari-crop': (mode) => ({
    width: 960, height: 720,
    body: `<div class="centre"><div style="overflow:hidden;padding:${COVER * 0.06}px;margin:-${COVER * 0.06}px">${cover('doom', 'book', mode, 400)}</div></div>`,
  }),
  '11-before-after': (mode) => ({
    body: `<div class="two-up">${cover('doom', 'none', mode)}<i style="background:${divider(mode)}"></i>${cover('doom', 'book', mode)}</div>`,
  }),
  // The bottom-right corner, up close
  '12-shadow-closeup': (mode) => ({
    height: 720,
    body: `<div style="position:absolute;left:170px;top:-640px">${cover('doom', 'book', mode, 800)}</div>`,
  }),
  // Four covers in a grid. The dividers run from the top of the top row's covers
  // to the bottom of the bottom row's, and from the left column's left edge to
  // the right column's right edge, crossing in the middle.
  '15-four-covers': (mode) => {
    const names = ['frog', 'memory-police', 'wild-birds', 'greyhound'];
    const w = 260;
    const h = (n) => w * DIMS[n].height / DIMS[n].width;
    const cell = 720;
    const top = cell / 2 - Math.max(h(names[0]), h(names[1])) / 2;
    const bottom = cell + cell / 2 + Math.max(h(names[2]), h(names[3])) / 2;
    const left = cell / 2 - w / 2;
    const right = cell + cell / 2 + w / 2;
    return {
      height: 1440,
      body: `<div class="grid">
        ${names.map((n) => `<div class="cell">${cover(n, 'book', mode, w)}</div>`).join('')}
        <i style="position:absolute;left:${cell - 0.5}px;top:${top}px;height:${bottom - top}px;width:1px;background:${divider(mode)}"></i>
        <i style="position:absolute;top:${cell - 0.5}px;left:${left}px;width:${right - left}px;height:1px;background:${divider(mode)}"></i>
      </div>`,
    };
  },
};

// The layers animation: the glow, the tail, the core and the room shade, added
// one at a time. `t` fades the layer being added in, for the short crossfades.
function layersFrame(mode, step, t) {
  const c = LIGHT[mode];
  const fade = (rgba, k) => rgba.replace(/[\d.]+\)$/, (a) => `${(parseFloat(a) * k).toFixed(3)})`);
  const glow = step >= 1 ? fade(c.glow, step === 1 ? t : 1) : null;
  const tail = step >= 2 ? fade(c.tail, step === 2 ? t : 1) : null;
  const core = step >= 3 ? fade(c.core, step === 3 ? t : 1) : null;
  const shade = step >= 4 ? (step === 4 ? t : 1) : 0;
  const filter = [
    glow && `drop-shadow(-3.5em -4.25em 5.5em ${glow})`,
    core && `drop-shadow(9.36em 8.11em 3.96em ${core})`,
    tail && `drop-shadow(14.79em 11.63em 14em ${tail})`,
  ].filter(Boolean).join(' ') || 'none';
  const shadeAlpha = (mode === 'dark' ? 0.16 : 0.07) * shade;
  return {
    width: W, height: H,
    html: `<!doctype html><html><head><meta charset="utf-8"><style>
      html, body { margin: 0; }
      body { width: ${W}px; height: ${H}px; overflow: hidden; position: relative; background: transparent; }
      img { display: block; }
      .shade { position: absolute; inset: 0; background: linear-gradient(135deg, transparent 35%, rgba(0,0,0,${shadeAlpha}) 100%); }
      .centre { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
    </style></head><body><div class="shade"></div><div class="centre"><img src="covers/doom.png" style="width:${COVER}px;font-size:${COVER / 100}px;filter:${filter}"></div></body></html>`,
  };
}

function html(scene, mode) {
  const s = SCENES[scene](mode);
  const width = s.width || W;
  const height = s.height || H;
  return {
    width, height,
    html: `<!doctype html><html><head><meta charset="utf-8"><style>
      html, body { margin: 0; }
      body { width: ${width}px; height: ${height}px; overflow: hidden; position: relative; background: transparent; }
      img { display: block; }
      .centre { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
      /* Centred with a gap, not spread out: the tail needs room before the image edge */
      .two-up { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 120px; }
      .two-up i { display: block; width: 1px; height: 62%; }
      .row { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 120px; }
      .grid { position: absolute; inset: 0; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
      .cell { display: flex; align-items: center; justify-content: center; }
    </style></head><body>${s.body}</body></html>`,
  };
}

// A soft shadow over a near-black page fades through only a dozen or so alpha
// levels, and each one shows as a ring. A little noise in the alpha channel
// breaks the steps up, the way Trema's page grain does, and WebP keeps alpha
// lossless, so it survives the build.
async function dither(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let seed = 1;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 3; i < data.length; i += 4) {
    const a = data[i];
    if (a === 0 || a === 255) continue;
    const n = Math.round((rand() + rand() - 1) * 3);
    data[i] = Math.max(1, Math.min(254, a + n));
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(file + '.tmp');
  fs.renameSync(file + '.tmp', file);
}

// The scenes are drawn on a generous canvas so no shadow is clipped. Once
// rendered, the empty ground above and below the covers is cut back to a
// margin, so a caption sits close under the books instead of under a stretch
// of nothing. The width stays, so every cover keeps the same scale on the page.
async function tighten(file, margin = 48 * SCALE) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let top = info.height, bottom = 0, left = info.width, right = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 12) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  const box = {
    left: 0, top: Math.max(0, top - margin),
    width: info.width,
    height: Math.min(info.height, bottom + margin + 1) - Math.max(0, top - margin),
  };
  await sharp(file).extract(box).png().toFile(file + '.tmp');
  fs.renameSync(file + '.tmp', file);
}

async function main() {
  const only = process.argv.slice(2);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'book-light-'));
  fs.mkdirSync(path.join(work, 'covers'));
  for (const [name, file] of Object.entries(COVERS)) {
    const info = await sharp(path.join(ROOT, 'src/assets/newsletter', file)).trim({ threshold: 10 }).png().toFile(path.join(work, 'covers', `${name}.png`));
    DIMS[name] = { width: info.width, height: info.height };
  }
  for (const scene of Object.keys(SCENES)) {
    if (only.length && !only.some((n) => scene.startsWith(n))) continue;
    for (const mode of ['light', 'dark']) {
      const { width, height, html: page } = html(scene, mode);
      const file = path.join(work, `${scene}-${mode}.html`);
      fs.writeFileSync(file, page);
      const out = path.join(OUT, `book-light-${scene}${mode === 'dark' ? '-dark' : ''}.png`);
      execFileSync(CHROME, [
        '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--default-background-color=00000000',
        `--force-device-scale-factor=${SCALE}`, `--window-size=${width},${height}`,
        `--screenshot=${out}`, `file://${file}`,
      ], { stdio: 'ignore' });
      await dither(out);
      await tighten(out);
      const meta = await sharp(out).metadata();
      console.log(path.basename(out), `${meta.width}x${meta.height}`);
    }
  }
  if (!only.length || only.some((n) => 'layers'.startsWith(n))) {
    for (const mode of ['light', 'dark']) {
      const frames = [];
      const add = async (step, t, ms) => {
        const { html: page } = layersFrame(mode, step, t);
        const file = path.join(work, `layers-${mode}-${frames.length}.html`);
        fs.writeFileSync(file, page);
        const png = file.replace(/\.html$/, '.png');
        execFileSync(CHROME, [
          '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--default-background-color=00000000',
          `--force-device-scale-factor=${ANIMATION_SCALE}`, `--window-size=${W},${H}`, `--screenshot=${png}`, `file://${file}`,
        ], { stdio: 'ignore' });
        await dither(png);
        frames.push('-d', String(ms), png);
      };
      await add(0, 1, 1400);
      for (let step = 1; step <= 4; step++) {
        for (const t of [0.35, 0.7]) await add(step, t, 60);
        await add(step, 1, 1400);
      }
      const out = path.join(ROOT, 'src/assets/animations', `book-light-layers${mode === 'dark' ? '-dark' : ''}.webp`);
      execFileSync('img2webp', ['-loop', '0', '-mixed', '-q', '80', ...frames, '-o', out], { stdio: 'ignore' });
      const meta = await sharp(out).metadata();
      console.log(path.basename(out), `${meta.width}x${meta.height}`, `${meta.pages} frames`);
    }
  }
  fs.rmSync(work, { recursive: true, force: true });
}

main().catch((err) => { console.error(err); process.exit(1); });
