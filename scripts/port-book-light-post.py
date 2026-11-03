#!/usr/bin/env python3
"""Port the Obsidian draft of “Lighting Trema’s books” into the site's journal file.

The note holds the prose; the site file holds the figure markup (light and dark
renditions, panel classes, captions). This script marries the two: it keeps the
site's frontmatter and figure blocks, keyed by image name, and replaces every
paragraph with the note's text. Run it after editing the note:

    python3 scripts/port-book-light-post.py
"""
import re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'src/journal/lighting-a-bookshelf.md'
NOTE = Path.home() / 'Obsidian/Obsidian/Writing/Journal/2026/Lighting a bookshelf.md'

# Figures that sit in the text column rather than across the page
INLINE = {'10-safari-crop'}
H1 = 'Lighting Trema’s books in Figma and code'
DATE = 'September 24, 2026'
PROSE = '<div class="w-full max-w-lg ml-auto prose prose-lg font-serif {margin} dark:prose-invert">'
BOOKMARK = '''{% bookmark
  url="/journal/trema-ghost-theme/",
  title="A fresh coat of paint for Trema",
  description="After over two years of writing a book recommendation per month,
    it was time to design a new and improved reading experience.",
  image="/assets/journal/trema-featured-img.png"
%}'''

site = SITE.read_text(encoding='utf-8')
note = NOTE.read_text(encoding='utf-8')
frontmatter = site[:site.index('---', 4) + 3]

# The site's figure blocks, keyed by image name, captions stripped
figures = {}
for m in re.finditer(r'<figure class="[^"]*">(.*?)</figure>', site, re.S):
    body = m.group(1)
    src = re.search(r'(?:retinaImage "src/assets/journal/book-light-|src="/assets/animations/book-light-)([^".]+)', body)
    if not src or src.group(1) in figures:
        continue
    body = re.sub(r'<figcaption[^>]*>.*?</figcaption>', '', body, flags=re.S).rstrip()
    figures[src.group(1)] = body

def curl(t):
    t = re.sub(r"(\w)'(\w)", r'\1’\2', t)
    t = re.sub(r'(^|[\s(])"', r'\1“', t).replace('"', '”')
    # markdown link titles and code stay straight
    t = re.sub(r'\]\(([^)]*)\)', lambda m: '](' + m.group(1).replace('“', '"').replace('”', '"') + ')', t)
    t = re.sub(r'`[^`]*`', lambda m: m.group(0).replace('“', '"').replace('”', '"').replace('’', "'"), t)
    return t

def inline(t):
    t = curl(t)
    return re.sub(r'(?<![\w`/])(CSS|SVG|HTML)(?![\w`])', r'<span class="smallcaps">\1</span>', t)

def caption(t):
    t = curl(t.strip().strip('_'))
    return re.sub(r'\*(.+?)\*', r'<em>\1</em>', t)

# Photographs, as opposed to rendered scenes: one rendition, no dark variant
PHOTOS = {
    '05-window-light': ('jpg', 'Miranda July’s All Fours lying on a wooden table in soft light from a window'),
}

# Rendered scenes added after the site file was first written: light and dark
# renditions, alt text here
SCENES = {
    '13-figma-styles': 'The Thin, Slim and Thick effect styles in Figma, side by side',
}

def figure(key, cap, inline_figure):
    if key in PHOTOS:
        ext, alt = PHOTOS[key]
        body = f'\n    {{% retinaImage "src/assets/journal/book-light-{key}.{ext}", "{alt}", 1200 %}}'
    elif key in SCENES:
        alt = SCENES[key]
        body = (f'\n    <span class="block dark:hidden book-light-scene">{{% retinaImage "src/assets/journal/book-light-{key}.png", "{alt}", 1200 %}}</span>'
                f'\n    <span class="hidden dark:block book-light-scene">{{% retinaImage "src/assets/journal/book-light-{key}-dark.png", "{alt}", 1200 %}}</span>')
    else:
        body = figures[key]
    if inline_figure:
        body = body.replace(', 1200 %}', ', 600 %}')
        return f'<figure class="book-light-inline">{body}\n    <figcaption>{cap}</figcaption>\n  </figure>'
    # captions sit in the text column, like the prose
    return f'<figure class="w-full">{body}\n    <figcaption class="pl-8 sm:pl-0 sm:max-w-lg sm:ml-auto text-balance">{cap}</figcaption>\n  </figure>'

body = note[note.index('---', 4) + 3:].strip('\n').split('\n')
out = [frontmatter, '\n\n', PROSE.format(margin='pt-[12.5vh]'), '\n\n', f'<h1>{H1}</h1>\n<span class="font-sans text-sm">{DATE}</span>\n\n']
pending = []   # (key, caption) of consecutive page-wide figures
i = 0

def flush():
    if not pending:
        return
    out.append('</div>\n\n<div class="sm:mt-32 mt-16 mb-16">\n')
    if len(pending) == 2:
        # A stacked pair shares one caption, between the two images
        (k1, c1), (k2, c2) = pending
        lc = lambda t: t[0].lower() + t[1:]
        pending[:] = [(k1, f'Above, {lc(c1)}. Below, {lc(c2)}.'), (k2, '')]
    for n, (key, cap) in enumerate(pending):
        block = figure(key, cap, False)
        if not cap:
            block = re.sub(r'\n    <figcaption[^>]*></figcaption>', '', block)
        if n:
            block = block.replace('<figure class="w-full">', '<figure class="w-full mt-12 sm:mt-16">', 1)
        out.append('  ' + block + '\n')
    out.append('</div>\n\n' + PROSE.format(margin='sm:mt-24 mt-16') + '\n\n')
    pending.clear()

while i < len(body):
    line = body[i]
    m = re.match(r'!\[([^\]]*)\]\(([^)]+)\)', line.strip())
    if line.strip().startswith('[Instagram screenshot'):
        i += 1; continue
    if m:
        key = re.sub(r'\.(png|webp|jpg)$', '', m.group(2)).replace('book-light-', '')
        cap = m.group(1)
        if i + 1 < len(body) and body[i + 1].strip().startswith('_'):
            cap = body[i + 1].strip(); i += 1
        cap = caption(cap)
        if key in INLINE:
            flush(); out.append(figure(key, cap, True) + '\n\n')
        else:
            pending.append((key, cap))
        i += 1; continue
    if line.strip() == '' and pending:
        i += 1; continue
    flush()
    if line.startswith('```'):
        out.append(line + '\n'); i += 1
        while not body[i].startswith('```'):
            out.append(body[i] + '\n'); i += 1
        out.append('```\n\n'); i += 1; continue
    if line.strip().startswith('[bookmark card'):
        out.append(BOOKMARK + '\n\n'); i += 1; continue
    if line.strip().startswith('… needs an ending'):
        i += 1; continue
    if line.strip() == '':
        i += 1; continue
    # list items and headings keep their markers; everything is one line per paragraph
    out.append(inline(line.strip()) + '\n')
    nxt = body[i + 1] if i + 1 < len(body) else ''
    if not (line.lstrip().startswith(('- ', '* ')) or re.match(r'\d+\. ', line.lstrip())) or not (nxt.lstrip().startswith(('- ', '* ')) or re.match(r'\d+\. ', nxt.lstrip())):
        out.append('\n')
    i += 1
flush()
out.append('</div>\n')
text = re.sub(r'\n{3,}', '\n\n', ''.join(out))
SITE.write_text(text, encoding='utf-8')
print(f'figures: {text.count("<figure")}, inline: {text.count("book-light-inline")}, prose divs: {text.count("max-w-lg ml-auto")}, closes: {text.count(chr(10) + "</div>")}')
