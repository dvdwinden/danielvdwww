---
layout: base.njk
title: "Lighting a bookshelf"
bodyClass: bg-stone
draft: true
date: 2026-09-24
tags: [design, books, development, figma]
description: How the book covers on Trema got their light, going from a photo, to Figma, to code and back again, with Claude doing the engineering.
image:
  src: /assets/journal/book-light-11-before-after.png
  alt: "The Chronicles of DOOM on Trema, without light and with it"
  title: "Lighting a bookshelf"
---

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif pt-[12.5vh] dark:prose-invert">

<h1>Lighting a bookshelf</h1>
<span class="font-sans text-sm">September 24, 2026</span>

Every book on [Trema](http://trema.website?ref=daniel.pizza "Trema") sits on a small coloured card: pistachio for fiction, powder blue for non-fiction. When I started the publication, those covers were digital: artwork I’d downloaded from publishers’ websites. Later, I started [photographing the books themselves](/journal/trema-ghost-theme/ "A fresh coat of paint for Trema"), and bought paper copies of the ones I’d read on my Kindle so I could. The photos made the books feel real, but on the website they still sat on their cards like stickers.

It was Instagram that made me notice. When I started posting my book recommendations there, I saw the covers bigger, and more often, than I ever had on the website, and I was a little appalled by how I’d handled the shading.

It bothered me because I’m after realism. I photograph the books because I don’t want them to look digital. I want Trema to feel like a book nook: something tactile, a stack of real books you could pick up. A flat, generic shadow works against that, so I wanted the light to be as real as I could make it. Over the past few days, I gave the covers some light, as if each book were lying on a table by a window.

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    <span class="block dark:hidden">{% retinaImage "src/assets/journal/book-light-11-before-after.png", "The Chronicles of DOOM on Trema, without light and with it", 1200 %}</span>
    <span class="hidden dark:block">{% retinaImage "src/assets/journal/book-light-11-before-after-dark.png", "The Chronicles of DOOM on Trema, without light and with it", 1200 %}</span>
    <figcaption class="pl-8 sm:pl-0 sm:max-w-lg sm:ml-auto">The same cover without light, and with Book light</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

For this post, I’ve lit the covers on the background of the page you’re reading, instead of Trema’s cards, so the light sits on the same surface as the words.

I’m a designer, not an engineer. I know my way around <span class="smallcaps">HTML</span> and <span class="smallcaps">CSS</span>, but this project went further than I’d get on my own, so I did it with Claude. I decided what it should look like, in Figma, and judged every result; Claude did most of the engineering.

What I like most is that it never went in a straight line. The light went from a photo, to Figma, to code, back to Figma, and back to code again, and every round made the other side better.

## Starting with a generic shadow
The first version was the kind of shadow you find in a good <span class="smallcaps">CSS</span> tutorial: a few soft shadows stacked on top of each other, each a little bigger and fainter than the last. It was fine, and you’d never notice it. It also looked like every other website. The books weren’t sitting in a place. They were sitting in a browser.

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    <span class="block dark:hidden">{% retinaImage "src/assets/journal/book-light-01-02-no-light-generic.png", "The cover without a shadow, next to the same cover with a faint, neutral, layered shadow", 1200 %}</span>
    <span class="hidden dark:block">{% retinaImage "src/assets/journal/book-light-01-02-no-light-generic-dark.png", "The cover without a shadow, next to the same cover with a faint, neutral, layered shadow", 1200 %}</span>
    <figcaption class="pl-8 sm:pl-0 sm:max-w-lg sm:ml-auto">No light at all, and the generic shadow: soft, neutral, and easy to miss</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

The next step was to design the shadow in Figma first, and have the code follow. I tinted it to match the surface underneath, so on Trema the non-fiction shadow is a deep slate blue instead of grey (and here, a warm grey), and made a lighter version for thin books. That helped, but it was still just a shadow under a book, with no light coming from anywhere.

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    <span class="block dark:hidden">{% retinaImage "src/assets/journal/book-light-03-tinted-shadow.png", "The cover with one shadow, tinted slate blue to match the card", 1200 %}</span>
    <span class="hidden dark:block">{% retinaImage "src/assets/journal/book-light-03-tinted-shadow-dark.png", "The cover with one shadow, tinted slate blue to match the card", 1200 %}</span>
    <figcaption class="pl-8 sm:pl-0">One shadow, tinted to the surface underneath</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

## Looking for the light
In Figma I tried a lot of lighting: hard sun, a higher sun, late afternoon, a low evening sun, light falling through a window frame or through leaves, a warm golden tint. Most of it didn’t work. The patterns and the tint pulled attention away from the covers, and a plain offset shadow made the books look like they were floating above the card.

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    <span class="block dark:hidden">{% retinaImage "src/assets/journal/book-light-04-three-suns.png", "Three sun explorations: a hard sun, a higher sun and a low evening sun", 1200 %}</span>
    <span class="hidden dark:block">{% retinaImage "src/assets/journal/book-light-04-three-suns-dark.png", "Three sun explorations: a hard sun, a higher sun and a low evening sun", 1200 %}</span>
    <figcaption class="pl-8 sm:pl-0 sm:max-w-lg sm:ml-auto">Three of the explorations: a hard sun, a higher sun and a low evening sun</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

What finally worked was to stop drawing from memory. I collected a few photos of books lying on a table in soft window light, and had Claude measure how the brightness changes across each one: how dark the shadow gets, how far it reaches, how much brighter the table is on the other side. The photos agreed with each other:

- On one side there’s a shadow about half as bright as the table. It stays dark for a short stretch, then fades out by about a fifth of the book’s width.
- The other side of the book is a little brighter than the rest of the table.
- There’s hardly any shadow above or below the book.
- The cover itself doesn’t change at all.

Matching those numbers got us further in an afternoon than all the eyeballing before it had. From there I tuned it by eye until it felt right, with the light coming from the top left.

## Book light
I ended up calling it _Book light_. It has four parts, and every size is a fraction of the cover’s width, so a small thumbnail and a large cover are lit the same way:

1. **Glow**: a soft white bloom up and to the left of the book, where the window light hits the table. On cards this light, it’s more something you feel than see.
2. **Tail**: a wide, soft shadow that trails off down and to the right.
3. **Core**: a tight, darker shadow right along the book’s edge, where it touches the table.
4. **Room falloff**: the card gets very slightly darker towards the bottom right, away from the window.

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    <img src="/assets/animations/book-light-layers.webp" alt="The glow, the tail, the core and the room falloff, added one at a time" class="w-full dark:hidden" loading="lazy" />
    <img src="/assets/animations/book-light-layers-dark.webp" alt="The glow, the tail, the core and the room falloff, added one at a time" class="hidden w-full dark:block" loading="lazy" />
    <figcaption class="pl-8 sm:pl-0">Book light, one layer at a time: the glow, the tail, the core and the room falloff</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

In Figma, the glow, tail and core are three drop shadows saved together as one effect style, and the falloff is part of the card’s fill. Every cover in the file I make Trema’s Instagram posts in uses them, so the posts and the website are lit the same way.

The shadow also depends on the book. A thick hardcover sits higher off the table than a slim paperback, so it casts a longer shadow, and every cover comes in a thin and a thick version. I decide which by taking the book off the shelf and looking at it. On Trema that’s a hidden tag on the post, and in Figma it’s a choice between two styles.

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    <span class="block dark:hidden">{% retinaImage "src/assets/journal/book-light-14-figma-three-shadows.png", "The glow, tail and contact shadow as drop shadows in Figma", 1200 %}</span>
    <span class="hidden dark:block">{% retinaImage "src/assets/journal/book-light-14-figma-three-shadows-dark.png", "The glow, tail and contact shadow as drop shadows in Figma", 1200 %}</span>
    <figcaption class="pl-8 sm:pl-0">The glow, the tail and the core, as three drop shadows in Figma</figcaption>
  </figure>
  <figure class="w-full mt-4">
    <span class="block dark:hidden">{% retinaImage "src/assets/journal/book-light-13-figma-style-dialog.png", "The Book light effect style in Figma", 1200 %}</span>
    <span class="hidden dark:block">{% retinaImage "src/assets/journal/book-light-13-figma-style-dialog-dark.png", "The Book light effect style in Figma", 1200 %}</span>
    <figcaption class="pl-8 sm:pl-0 sm:max-w-lg sm:ml-auto text-balance">The effect style that holds them, used on every cover in the Instagram file</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

## From Figma to the website
Because every value was already a fraction of the cover’s width, getting it onto the website was mostly a matter of translating. <span class="smallcaps">CSS</span> has a `drop-shadow` filter that follows the shape of the image, much like a drop shadow in Figma. Each cover gets three of them, and the only things that change from place to place are the colours and a handful of ratios:

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

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    <span class="block dark:hidden">{% retinaImage "src/assets/journal/book-light-12-shadow-closeup.png", "A close-up of the cover’s bottom-right corner and its shadow", 1200 %}</span>
    <span class="hidden dark:block">{% retinaImage "src/assets/journal/book-light-12-shadow-closeup-dark.png", "A close-up of the cover’s bottom-right corner and its shadow", 1200 %}</span>
    <figcaption class="pl-8 sm:pl-0">Those ratios up close: the tight core along the book’s edge, and the tail fading out down and to the right</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">


It didn’t stop there. Seeing the light in the browser, on real covers at real sizes, sent me back to Figma more than once, for a longer shadow for thicker hardcovers, for instance. Whatever changed there went straight back into the code, and because both sides speak in the same fractions of a cover’s width, that took minutes rather than days.

In dark mode the glow gets much fainter and the shadows turn black, because a slate-blue shadow on a dark card looks like a pale halo.

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    <span class="block dark:hidden">{% retinaImage "src/assets/journal/book-light-09-dark.png", "The cover in dark mode, with black shadows and a faint glow", 1200 %}</span>
    <span class="hidden dark:block">{% retinaImage "src/assets/journal/book-light-09-dark-dark.png", "The cover in dark mode, with black shadows and a faint glow", 1200 %}</span>
    <figcaption class="pl-8 sm:pl-0">Dark mode: a fainter glow, and black shadows instead of slate blue</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

## Five ways to lose a shadow
In Chrome, it worked almost straight away. Safari kept drawing the shadows wrong, in five different ways: cutting them off while a cover moved on hover, leaving old scraps of shadow behind, cropping the shadow to a neat rectangle around the book, or only half redrawing it after a cover loaded.

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    <span class="block dark:hidden">{% retinaImage "src/assets/journal/book-light-10-safari-crop.png", "The cover with its shadow cropped to a box around the image", 1200 %}</span>
    <span class="hidden dark:block">{% retinaImage "src/assets/journal/book-light-10-safari-crop-dark.png", "The cover with its shadow cropped to a box around the image", 1200 %}</span>
    <figcaption class="pl-8 sm:pl-0">One of Safari’s mistakes: the shadow cut off at a box around the image</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

Each of those had its own fix, and none of them were anything I’d have found on my own. The short version: Safari tries to save work by only redrawing the part of the page it thinks has changed, and a soft shadow that spills past the edge of an image confuses it. Most of the fixes either give Safari more room to draw in, or give it a nudge to redraw the whole shadow.

That nudge was the most stubborn part. The first version changed the shadow by a hundredth of a pixel for a moment, which was enough on my Mac. On my iPhone, the shadows were still cut off, and differently every time I loaded the page. Claude’s first guess at a fix didn’t help, and we threw it away.

What did help was the same thing that fixed the lighting: testing on the real device instead of guessing. I plugged my iPhone into my Mac, and Claude could then open pages in Safari on the phone, load a cover late on purpose, and take screenshots of what happened. It turned out iPhones ignore a change as small as a hundredth of a pixel. Swapping it for a change they do notice fixed it, and the screenshots from the phone showed the difference.

</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    <span class="block dark:hidden">{% retinaImage "src/assets/journal/book-light-15-four-covers.png", "Harlem Shuffle, The Memory Police, The Wild Birds and Greyhound, each lit with Book light", 1200 %}</span>
    <span class="hidden dark:block">{% retinaImage "src/assets/journal/book-light-15-four-covers-dark.png", "Harlem Shuffle, The Memory Police, The Wild Birds and Greyhound, each lit with Book light", 1200 %}</span>
    <figcaption class="pl-8 sm:pl-0 sm:max-w-lg sm:ml-auto">Four more covers under the same light: <em>Harlem Shuffle</em>, <em>The Memory Police</em>, <em>The Wild Birds</em> and <em>Greyhound</em></figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

## What I’d keep
The back and forth is what I’d keep most. A photo told us what real light does, Figma was where I could see it and judge it, and the code was where it had to hold up, on every cover, at every size, in every browser.

Both halves of this project also came down to the same lesson. The lighting only came together once we measured real photos instead of going from memory, and the iPhone bug only went away once we tested on the phone itself instead of guessing.

Working this way also changed what my job was. I didn’t write most of the code, but I made every call on how it should look, and I was the one who noticed when something was off.

</div>
