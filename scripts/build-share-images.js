// Composes the share (og:image) pictures for the Library and Newsletter pages
// out of what those pages already show: the newest covers in the Library, and
// the newest book cutouts in the Newsletter. Run it after adding books so the
// pictures stay current, then commit the PNGs it writes:
//
//   npm run share-images
//
// Each is drawn at 2400×1260. The image pipeline keeps a rendition at that
// full size for anything named share-*, and the og:image tags point at it. Like the Links and Photos images they carry no text: the og:title
// names the page.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const sharp = require('sharp');

const W = 2400;
const H = 1260;

// Flattens layers onto a background and writes the PNG. Layers are drawn on
// an oversized canvas first, so a shadow or a cutout may run past the edge
// without sharp refusing the composite.
async function compose(layers, background, outFile) {
  const bleed = 200;
  const canvas = await sharp({ create: { width: W + bleed * 2, height: H + bleed * 2, channels: 4, background } })
    .composite(layers.map((l) => ({ ...l, left: l.left + bleed, top: l.top + bleed })))
    .png()
    .toBuffer();
  await sharp(canvas).extract({ left: bleed, top: bleed, width: W, height: H }).flatten({ background }).png().toFile(outFile);
}

// The page's image shortcode accepts a path whose extension differs from the
// file on disk, so do the same.
const EXTENSIONS = ['.avif', '.webp', '.jpg', '.jpeg', '.png', '.JPG', '.PNG'];
function resolveImage(file) {
  if (fs.existsSync(file)) return file;
  const base = file.replace(/\.\w+$/, '');
  const found = EXTENSIONS.map((e) => base + e).find((f) => fs.existsSync(f));
  if (!found) throw new Error(`No image found for ${file}`);
  return found;
}

// ---------------------------------------------------------------------------
// Library: the newest covers, two rows of six, on the page's amber. No text,
// like the Links and Photos images: the og:title names the page.
// ---------------------------------------------------------------------------

function libraryCovers() {
  const src = fs.readFileSync(path.join(ROOT, 'src/library.njk'), 'utf8');
  const years = src.split(/<h2[^>]*>\s*(\d{4})\s*<\/h2>/);
  // split() leaves [preamble, year, body, year, body, ...]; the first year is
  // the newest. Its body lists the year's books newest first.
  const body = years[2] || '';
  return [...body.matchAll(/src\/assets\/library\/[^"\s]+/g)].map((m) => m[0]);
}

// A 3×3 thumbnail of a cover, for telling two of a series apart from the
// rest: a run of Fitzcarraldo blues says less than one. Nine cells rather
// than one average, so two different covers that happen to share a tone are
// not mistaken for each other.
async function thumbprint(file) {
  const { data } = await sharp(file).resize(3, 3, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return Array.from(data);
}

// Root-mean-square difference per channel, 0–255.
function thumbDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum / a.length);
}

// Picks `count` covers in the order given, passing over one whose average
// colour is close to a cover already picked.
async function pickDistinct(covers, count) {
  const picked = [];
  for (const cover of covers) {
    if (picked.length === count) break;
    const file = resolveImage(path.join(ROOT, cover));
    const colour = await thumbprint(file);
    if (picked.some((p) => thumbDistance(p.colour, colour) < 20)) {
      console.log(`  skipping ${path.basename(file)}: too close in colour to one already placed`);
      continue;
    }
    picked.push({ file, colour });
  }
  return picked.map((p) => p.file);
}

// A grid of covers, `cols` by `rows`, filling the canvas inside a margin.
// Covers vary a little in proportion; a crop of a few pixels at the edge
// keeps the grid even.
async function coverGrid(files, { cols, rows, margin = 60, gutter = 30 }) {
  const tileW = Math.floor((W - margin * 2 - gutter * (cols - 1)) / cols);
  const tileH = Math.floor((H - margin * 2 - gutter * (rows - 1)) / rows);
  const layers = [];
  for (let i = 0; i < cols * rows && i < files.length; i++) {
    const cover = await sharp(files[i])
      .resize(tileW, tileH, { fit: 'cover', kernel: 'lanczos3' })
      .toBuffer();
    layers.push({
      input: cover,
      left: margin + (i % cols) * (tileW + gutter),
      top: margin + Math.floor(i / cols) * (tileH + gutter),
    });
  }
  return layers;
}

async function buildLibrary() {
  const files = await pickDistinct(libraryCovers(), 12);
  const layers = await coverGrid(files, { cols: 6, rows: 2 });
  await compose(layers, '#efe9e2', path.join(ROOT, 'src/assets/share-library.png'));
}

// ---------------------------------------------------------------------------
// Newsletter: the same grid, of the books most recently recommended. The
// posts carry photographs of the books; the Library has the covers, so each
// post is matched to its Library entry by title.
// ---------------------------------------------------------------------------

const normalise = (t) =>
  String(t)
    .toLowerCase()
    .replace(/[’'‘]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

function libraryEntries() {
  const src = fs.readFileSync(path.join(ROOT, 'src/library.njk'), 'utf8');
  const entries = [];
  // Each book: its cover in the image shortcode, then an anchor whose title
  // attribute reads "<Title> by <Author>".
  const re = /\{% image\s+"(src\/assets\/library\/[^"]+)"[\s\S]*?title="([^"]+) by [^"]+"/g;
  let m;
  while ((m = re.exec(src))) entries.push({ cover: m[1], title: normalise(m[2]) });
  return entries;
}

function newsletterBooks() {
  const dir = path.join(ROOT, 'src/newsletter');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const fm = fs.readFileSync(path.join(dir, f), 'utf8').split('---')[1] || '';
      const date = (fm.match(/^date:\s*(\S+)/m) || [])[1];
      const title = (fm.match(/^title:\s*"?(.+?)"?\s*$/m) || [])[1] || '';
      const draft = /^draft:\s*true/m.test(fm);
      // "Author: Title (Year)" → "Title"
      const book = title.replace(/^[^:]+:\s*/, '').replace(/\s*\(\d{4}\)\s*$/, '');
      return { date, book: normalise(book), slug: path.basename(f, '.md'), draft };
    })
    .filter((p) => p.date && p.book && !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

function newsletterCovers() {
  const entries = libraryEntries();
  const covers = [];
  for (const post of newsletterBooks()) {
    const entry =
      entries.find((e) => e.title === post.book) ||
      entries.find((e) => post.book.startsWith(e.title) || e.title.startsWith(post.book)) ||
      entries.find((e) => post.book.includes(e.title) || e.title.includes(post.book));
    if (!entry) {
      console.log(`  no Library cover for newsletter post ${post.slug}`);
      continue;
    }
    covers.push(entry.cover);
  }
  return covers;
}

async function buildNewsletter() {
  const files = await pickDistinct(newsletterCovers(), 12);
  const layers = await coverGrid(files, { cols: 6, rows: 2 });
  await compose(layers, '#ededea', path.join(ROOT, 'src/assets/share-newsletter.png'));
}

// ---------------------------------------------------------------------------
// Journal: a sheet of hero images from recent posts, two rows of three, on
// the page's stone. No text, like the Links and Photos images: the og:title
// names the page.
// ---------------------------------------------------------------------------

const JOURNAL_IMAGES = [
  'src/assets/journal/nogood01.jpg',
  'src/assets/journal/aulus-les-bains07.jpg',
  'src/assets/journal/drawing-house.webp',
  'src/assets/journal/pyrenees.jpg',
  'src/assets/journal/memoria.avif',
  'src/assets/journal/2025-in-music.JPG',
];

async function buildJournal() {
  const margin = 60;
  const gutter = 30;
  const cols = 3;
  const rows = 2;
  const tileW = Math.floor((W - margin * 2 - gutter * (cols - 1)) / cols);
  const tileH = Math.floor((H - margin * 2 - gutter * (rows - 1)) / rows);

  const layers = [];
  for (let i = 0; i < JOURNAL_IMAGES.length; i++) {
    const file = resolveImage(path.join(ROOT, JOURNAL_IMAGES[i]));
    const tile = await sharp(file)
      .resize(tileW, tileH, { fit: 'cover', position: 'attention', kernel: 'lanczos3' })
      .toBuffer();
    layers.push({
      input: tile,
      left: margin + (i % cols) * (tileW + gutter),
      top: margin + Math.floor(i / cols) * (tileH + gutter),
    });
  }

  await compose(layers, '#e8e6e0', path.join(ROOT, 'src/assets/share-journal.png'));
}

(async () => {
  await buildLibrary();
  await buildNewsletter();
  await buildJournal();
  console.log('Wrote src/assets/share-library.png, share-newsletter.png and share-journal.png');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
