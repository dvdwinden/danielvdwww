---
layout: base.njk
title: "Lighting Trema’s books in Figma and code"
bodyClass: bg-stone
draft: true
date: 2026-09-24
tags: [design, books, development, figma]
description: How the book covers on Trema got their light, going from a photo, to Figma, to code and back again, with Claude doing the engineering.
image:
  src: /assets/journal/book-light-11-before-after.png
  alt: "The Chronicles of DOOM on Trema, without light and with it"
  title: "Lighting Trema’s books in Figma and code"
---

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif pt-[12.5vh] dark:prose-invert">

<h1>Lighting Trema’s books in Figma and code</h1>
<span class="font-sans text-sm">September 24, 2026</span>

Every book on [Trema](http://trema.website?ref=daniel.pizza "Trema") sits on a coloured card on the homepage, or a coloured page for its recommendation: pistachio for fiction, powder blue for non-fiction. When I started the publication, the book covers were digital. I’d downloaded them from publishers’ websites and slapped them onto the site, like stickers.

Later, once the publication had settled into a rhythm, I wanted more tactility, and started photographing the books themselves.

{% bookmark
  url="/journal/trema-ghost-theme/",
  title="A fresh coat of paint for Trema",
  description="After over two years of writing a book recommendation per month,
    it was time to design a new and improved reading experience.",
  image="/assets/journal/trema-featured-img.png"
%}

Most books were already on my shelves, and I bought the ones I’d read digitally. At the time, across 30-odd photos, I cut the books out of their frame and placed them on a transparent background, applying a light shadow. I was happy to see the creases, curls, and dents in their covers—they go a long way to show these books were carried, read, and chucked into bags.

A while back, as I started posting my book recommendations to Instagram (I’d like to get a few more readers to the site), I saw the covers side-by-side, without the text to accompany them, and found myself somewhat appalled by how I’d handled the books’ shading. The books looked real. Their shading didn’t.

I photograph the books by hand because I want Trema to feel like a tactile and inviting book nook. A flat, generic shadow works against that feeling. I don’t have a photography setup, and don’t intend to get one, so I decided to make the light as real as I could with the tools I have and know: Figma, and code.

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    <span class="block dark:hidden book-light-scene">{% retinaImage "src/assets/journal/book-light-11-before-after.png", "The Chronicles of DOOM on Trema, without light and with it", 600 %}</span>
    <span class="hidden dark:block book-light-scene">{% retinaImage "src/assets/journal/book-light-11-before-after-dark.png", "The Chronicles of DOOM on Trema, without light and with it", 600 %}</span>
    <figcaption class="pl-8 sm:pl-0 sm:max-w-lg sm:ml-auto text-balance">The same cover without light, and with it</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

## Starting with a generic shadow

The first version was the kind of shadow you find in a decent <span class="smallcaps">CSS</span> tutorial: a few soft shadows stacked on top of each other, each a little bigger and fainter than the last. It was fine, but it also looked like the shading you see applied on every other website. It was clear the books weren’t sitting in a physical space. They were floating in a browser.

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    <span class="block dark:hidden book-light-scene">{% retinaImage "src/assets/journal/book-light-01-02-no-light-generic.png", "The cover without a shadow, next to the same cover with a faint, neutral, layered shadow", 600 %}</span>
    <span class="hidden dark:block book-light-scene">{% retinaImage "src/assets/journal/book-light-01-02-no-light-generic-dark.png", "The cover without a shadow, next to the same cover with a faint, neutral, layered shadow", 600 %}</span>
    <figcaption class="pl-8 sm:pl-0 sm:max-w-lg sm:ml-auto text-balance">No light at all, and the generic shadow: soft, neutral, and easy to (dis)miss</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

A small next step was to tint the shadow to match the surface underneath. In the example of a non-fiction book, a deep slate blue instead of a grey. I also made a lighter version for thinner books. That helped, but it was still just a shadow under a book, with no light coming from anywhere.

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    <span class="block dark:hidden book-light-scene book-light-panel">{% retinaImage "src/assets/journal/book-light-03-tinted-shadow.png", "The cover with one shadow, tinted slate blue to match the card", 600 %}</span>
    <span class="hidden dark:block book-light-scene book-light-panel">{% retinaImage "src/assets/journal/book-light-03-tinted-shadow-dark.png", "The cover with one shadow, tinted slate blue to match the card", 600 %}</span>
    <figcaption class="pl-8 sm:pl-0 sm:max-w-lg sm:ml-auto text-balance">One shadow, tinted to the surface underneath</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

## Looking for the light

In Figma I tried a lot of lighting: hard sun, a higher sun, late afternoon. A low evening sun, light falling through a window frame or through leaves, a warm golden tint. Most of it didn’t work. The patterns and the tint pulled attention away from the covers, and a plain offset shadow made the books look like they were levitating above their background.

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    <span class="block dark:hidden book-light-scene">{% retinaImage "src/assets/journal/book-light-04-three-suns.png", "Three sun explorations: a hard sun, a higher sun and a low evening sun", 600 %}</span>
    <span class="hidden dark:block book-light-scene">{% retinaImage "src/assets/journal/book-light-04-three-suns-dark.png", "Three sun explorations: a hard sun, a higher sun and a low evening sun", 600 %}</span>
    <figcaption class="pl-8 sm:pl-0 sm:max-w-lg sm:ml-auto text-balance">Three of the explorations: a hard sun, a higher sun and a low evening sun</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

I collected a few photos of books lying on a table in soft window light, and measured how the brightness changes across each one: how dark the shadow gets, how far it reaches, how much brighter the table is on the other side.

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    {% retinaImage "src/assets/journal/book-light-05-window-light.jpg", "Miranda July’s All Fours lying on a wooden table in soft light from a window", 1200 %}
    <figcaption class="pl-8 sm:pl-0 sm:max-w-lg sm:ml-auto text-balance">One of the reference photos: <em>All Fours</em> on the table by my window, in the light I was after</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

- On one side there’s a shadow about half as bright as the table. It stays dark for a short stretch, then fades out by about a fifth of the book’s width.
- The other side of the book is a little brighter than the rest of the table.
- There’s hardly any shadow above or below the book.

## The light, in four parts

The light I ended up mimicking has four parts, and every size is a fraction of the cover’s width, so a small thumbnail and a large cover are lit the same way:

1. **Glow**: a soft white bloom up and to the left of the book, where the supposed window light hits the table. On a light background, it’s more something you feel than see. On a dark background, it’s more noticeable.
2. **Tail**: a wide, soft shadow that trails off down and to the right.
3. **Core**: a tight, darker shadow right along the book’s edge, where it touches the table.
4. ‘**Room’ shade**: the card gets very slightly darker towards the bottom right, away from the window.

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    <img src="/assets/animations/book-light-layers.webp" alt="The glow, the tail, the core and the room shade, added one at a time" class="w-full dark:hidden" loading="lazy" />
    <img src="/assets/animations/book-light-layers-dark.webp" alt="The glow, the tail, the core and the room shade, added one at a time" class="hidden w-full dark:block" loading="lazy" />
    <figcaption class="pl-8 sm:pl-0 sm:max-w-lg sm:ml-auto text-balance">Above, the light, one layer at a time: the glow, the tail, the core and the room shade. Below, up close: the tight core along the book’s edge, and the tail fading out down and to the right.</figcaption>
  </figure>
  <figure class="w-full mt-12 sm:mt-16">
    <span class="block dark:hidden book-light-scene book-light-panel">{% retinaImage "src/assets/journal/book-light-12-shadow-closeup.png", "A close-up of the cover’s bottom-right corner and its shadow", 600 %}</span>
    <span class="hidden dark:block book-light-scene book-light-panel">{% retinaImage "src/assets/journal/book-light-12-shadow-closeup-dark.png", "A close-up of the cover’s bottom-right corner and its shadow", 600 %}</span>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

In Figma, the glow, tail and core are three drop shadows saved together as one effect style. The room shade is the one part the book doesn’t cast by itself: the card or page’s background colour on Trema has a faint gradient applied to it, a touch darker towards the bottom right, away from the ‘window’.

I use the same style on every background in the file for Trema’s Instagram posts, so the Instagram posts and the books on the website are lit in exactly the same way.

The shadow also depends on the book. A thick hardcover sits higher off the table than a slim paperback, so it should cast a longer shadow. In Figma, I created three styles for it: *Slim* for anything under about 150 pages, *Thin* for most paperbacks, and *Thick* for hardcovers. The same system is applied on Trema itself.

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    <span class="block dark:hidden book-light-scene">{% retinaImage "src/assets/journal/book-light-14-figma-three-shadows.png", "The glow, tail and contact shadow as drop shadows in Figma", 600 %}</span>
    <span class="hidden dark:block book-light-scene">{% retinaImage "src/assets/journal/book-light-14-figma-three-shadows-dark.png", "The glow, tail and contact shadow as drop shadows in Figma", 600 %}</span>
    <figcaption class="pl-8 sm:pl-0 sm:max-w-lg sm:ml-auto text-balance">Above, the glow, the tail and the core, as three drop shadows in Figma. Below, the three effect styles in Figma: Thin, Slim and Thick, used on every cover in the Instagram file.</figcaption>
  </figure>
  <figure class="w-full mt-12 sm:mt-16">
    <span class="block dark:hidden book-light-scene">{% retinaImage "src/assets/journal/book-light-13-figma-styles.png", "The Thin, Slim and Thick effect styles in Figma, side by side", 1200 %}</span>
    <span class="hidden dark:block book-light-scene">{% retinaImage "src/assets/journal/book-light-13-figma-styles-dark.png", "The Thin, Slim and Thick effect styles in Figma, side by side", 1200 %}</span>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

## From Figma to the website

Because every value was already a fraction of the cover’s width, getting it onto the website was mostly a matter of translating those values to <span class="smallcaps">CSS</span>. <span class="smallcaps">CSS</span> has a `drop-shadow` filter that follows the shape of the image, much like a drop shadow in Figma. Each cover gets three of them, and the only things that change from place to place are the colours (for fiction or non-fiction) and a handful of ratios:

```css
.post-image-card-nonfiction .post-image img {
    --glow: rgba(255, 255, 255, 0.5);
    --core: rgba(35, 47, 61, 0.22);
    --tail: rgba(35, 47, 61, 0.44);
    --cx: 0.0936; --cy: 0.0811; --cb: 0.0396;
    --tx: 0.1479; --ty: 0.1163; --tb: 0.14;
}
```

The first three lines are the colours of the glow, the core and the tail. The rest say how far each shadow moves and how soft it is, as a share of the cover’s width.

Those shares become pixels through the cover itself: the image’s font size is set to one percent of its width, so every shadow is written in `em` and scales with the book. The glow’s offsets never change, so they’re written in directly:

```css
img {
    font-size: calc(var(--w) / 100);
    filter:
        drop-shadow(-6.96em -8.53em 10.66em var(--glow))
        drop-shadow(calc(var(--cx) * 100em) calc(var(--cy) * 100em) calc(var(--cb) * 100em) var(--core))
        drop-shadow(calc(var(--tx) * 100em) calc(var(--ty) * 100em) calc(var(--tb) * 100em) var(--tail))
        var(--repaint,);
}
```

That last line is empty most of the time. It comes back in the Safari section.

In dark mode the glow gets much fainter and the shadows turn black, because a slate-blue shadow on a dark card looks like a weird, pale halo.

The glow offered up one more surprise. On a dark page it fades through only a dozen or so shades of grey, and on a good screen every step of that shows as a ring around the book, the kind of banding I hadn’t seen in years. The fix was putting a faint grain over top.

The grain is a fixed layer over the whole page, with the noise drawn by the browser from a small piece of <span class="smallcaps">SVG</span> inside the stylesheet:

```css
body::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    background: url("data:image/svg+xml,…");
}
```

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">
  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.04 0"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#n)"/>
</svg>
```

That’s a 240-pixel tile of noise, white at four percent, repeated across the page. The glow fades through it instead of over flat black, and the rings are gone.

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    <span class="block dark:hidden book-light-scene book-light-panel book-light-panel-dark">{% retinaImage "src/assets/journal/book-light-09-dark.png", "The cover in dark mode, with black shadows and a faint glow", 600 %}</span>
    <span class="hidden dark:block book-light-scene book-light-panel book-light-panel-dark">{% retinaImage "src/assets/journal/book-light-09-dark-dark.png", "The cover in dark mode, with black shadows and a faint glow", 600 %}</span>
    <figcaption class="pl-8 sm:pl-0 sm:max-w-lg sm:ml-auto text-balance">Dark mode: a fainter glow, and black shadows instead of slate blue</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

## Five ways to lose a shadow in Safari

In Chrome, this worked almost straight away. Safari, though, kept drawing the shadows wrong, in five different ways: cutting them off while a cover moved on hover, leaving old scraps of shadow behind, cropping the shadow to a neat rectangle around the book, or only half redrawing it after a cover loaded.

<figure class="book-light-inline">
    <span class="block dark:hidden book-light-scene book-light-panel">{% retinaImage "src/assets/journal/book-light-10-safari-crop.png", "The cover with its shadow cropped to a box around the image", 600 %}</span>
    <span class="hidden dark:block book-light-scene book-light-panel">{% retinaImage "src/assets/journal/book-light-10-safari-crop-dark.png", "The cover with its shadow cropped to a box around the image", 600 %}</span>
    <figcaption>One of Safari’s mistakes: the shadow cut off at a box around the image</figcaption>
  </figure>

Each of those had its own fix, and none of them were anything I’d have found on my own. Using Claude, I found out Safari treats the cover as a rectangle the size of the picture, and the shadow spills well outside it. Sometimes it cuts the shadow off at that rectangle’s edge. Sometimes, after a hover or a late-loading image, it repaints only the rectangle and leaves the *old* shadow around it. The fixes either make the rectangle bigger—with invisible padding around the cover—or change the shadow by an amount you can’t see, for a split second, so Safari repaints all of it.

I plugged my iPhone into my Mac, which let Claude open pages in Safari on the phone, make a cover load late on purpose, and take a screenshot of the result. Those screenshots showed what was going on: an iPhone simply ignores a shadow moving by a hundredth of a pixel. So instead of nudging the three shadows, we briefly add an invisible fourth one. That the phone does notice, and the cut-off shadows were gone. It’s that empty `--repaint` from before, filled in for two frames by a class the script adds and removes:

```css
.is-repainting {
    --repaint: drop-shadow(0 0 0 transparent);
}
```

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    <span class="block dark:hidden book-light-scene">{% retinaImage "src/assets/journal/book-light-15-four-covers.png", "Frog, The Memory Police, The Wild Birds and Greyhound, each under the same light", 1200 %}</span>
    <span class="hidden dark:block book-light-scene">{% retinaImage "src/assets/journal/book-light-15-four-covers-dark.png", "Frog, The Memory Police, The Wild Birds and Greyhound, each under the same light", 1200 %}</span>
    <figcaption class="pl-8 sm:pl-0 sm:max-w-lg sm:ml-auto text-balance">Four more covers under the same light: <em>Frog</em>, <em>The Memory Police</em>, <em>The Wild Birds</em> and <em>Greyhound</em></figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

The back and forth between my books, Figma, Claude and code was very enjoyable. I took photos of books in the light coming through my window to see what I was after, and used Figma to recreate it, see it, and judge it. The code was where I tried to make sure it held up for every cover, at every size, and in every browser, without having to rely on image exports or images being resized across resolutions.

The light is on every cover on Trema now, and on the Instagram posts, and most days I don’t notice it. What I notice is the covers: the creases, the bent corners, the spine that cracked in a bag. The next book I photograph won’t need any of this redone. I’ll cut it out, pick Slim, Thin or Thick, and it will sit on its card like the thirty before it. The window is built, and I get to go back to the books.

</div>
