---
layout: base.njk
title: "Why I made Proza, a typographic theme for Ghost"
bodyClass: bg-stone
date: 2026-10-20T10:20:00+02:00
draft: false
tags: [design, typography, ghost, publishing]
description: People kept asking whether they could use Trema’s theme. I said no, because it’s mine. But the question pointed at a gap, so I made something for everyone else.
image:
  src: /assets/journal/proza-hero.png
  alt: "Proza, a typographic theme for Ghost"
  title: "Why I made Proza, a typographic theme for Ghost"
---

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif pt-[12.5vh] dark:prose-invert">

<h1>Why I made Proza, a typographic theme for Ghost</h1>
<span class="font-sans text-sm">October 20, 2026</span>

Last year, after spending a few years establishing the habit of writing and sending out a post every month, I designed and built a theme of its own for [Trema](https://www.trema.website/?ref=daniel.pizza "Trema"), which I publish with [Ghost](https://ghost.org/?ref=daniel.pizza "Ghost"). I wrote about it at the time:

{% bookmark
  url="/journal/trema-ghost-theme/",
  title="A fresh coat of paint for Trema",
  description="After over two years of writing a book recommendation per month,
    it was time to design a new and improved reading experience."
%}

After I launched it, people started asking whether they could use the theme, too, and every time I said no. Not because I’m precious about the code, but because Trema’s theme is the manifestation of a very particular set of decisions for a very particular publication. The article page is built around a photograph of a paper book I took myself; the tags, and how they’re organised, influence the page’s layout; the typefaces, [_Degular_](https://ohnotype.co/fonts/degular?ref=daniel.pizza "Degular by Oh No Type Co") and [_Blanco_](https://www.fostertype.com/retail-type/blanco?ref=daniel.pizza "Blanco by Foster Type"), are ones I bought licences for, for my own two sites—I can’t hand them out in a zip file.

Strip all that away and what’s left isn’t really the Trema theme any more.

## Looking for a typographic theme
The question kept nagging at me, though. When I looked again at what people said they liked, it was the reading. The premium typefaces, the size of the text, the length of the lines. What they were asking for, I think, wasn’t _my_ theme. It was a theme that took the writing on the page seriously.

Scrolling through [Ghost’s marketplace](https://ghost.org/themes/?ref=daniel.pizza "Ghost’s themes"), I noticed nearly all its themes start from the picture: a magazine grid, a big feature image, cards in rows, with the text filling the space between. I couldn’t really find great themes that worked their way outwards from the writing and typography. That seemed like a gap worth plugging.

</div>

<div class="sm:mt-32 mt-16 mb-16">
<figure class="w-full">
  <div class="hidden sm:block">
    <div class="device-stage" style="aspect-ratio: 1524 / 1000">
      <div class="device-screen has-ring" style="left: 11.549%; top: 0; width: 87.927%; height: 90%; border-radius: 0.787cqw">
        <span class="device-dots"><i></i><i></i><i></i></span>
        <div class="device-page" style="--distance: -64%; --duration: 18s">
          <div class="dark:hidden">{% retinaImage "src/assets/journal/proza-hero-page-light.png", "", 1340 %}</div>
          <div class="hidden dark:block">{% retinaImage "src/assets/journal/proza-hero-page-dark.png", "", 1340 %}</div>
        </div>
      </div>
      <div class="device-layer">
        <div class="dark:hidden">{% retinaImage "src/assets/journal/proza-hero-phone-light.png", "Proza on a desktop, scrolling through the essay On reading slowly, and on a phone", 1400 %}</div>
        <div class="hidden dark:block">{% retinaImage "src/assets/journal/proza-hero-phone-dark.png", "Proza in dark mode on a desktop, scrolling through the essay On reading slowly, and on a phone", 1400 %}</div>
      </div>
    </div>
  </div>
  <div class="sm:hidden">
    <div class="dark:hidden">{% retinaImage "src/assets/journal/proza-hero-mobile.png", "Proza on two phones: the home page and a post", 1200 %}</div>
    <div class="hidden dark:block">{% retinaImage "src/assets/journal/proza-hero-mobile-dark.png", "Proza on two phones in dark mode: the home page and a post", 1200 %}</div>
  </div>
</figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

## A simple layout, beautifully set
I started with the typeface, and set the theme in [_Literata_](https://fonts.google.com/specimen/Literata?ref=daniel.pizza "Literata on Google Fonts") by [TypeTogether](https://www.type-together.com/?ref=daniel.pizza "TypeTogether"), a serif originally made for Google Play Books in 2014 and completely re-engineered years later. It’s open source, so it can ship with the theme, and it has the technical qualities a book face needs: real italics, ligatures, small caps, old-style figures, and [optical sizes](https://en.wikipedia.org/wiki/Optical_size "Optical size, on Wikipedia") that tighten up for headlines and open up for body text. It looks distinctive and refined, and it reads very well.

> [Literata 3](https://www.type-together.com/literata-font?ref=daniel.pizza "Literata by TypeTogether") is a typeface conceived for intensive editorial use, especially on screens of all sorts. Its main potential is in digital publishing, whether on the Web, electronic press, or mobile applications. You can set entire books, magazines, apps, and newspapers in this one typeface, all while using less bandwidth than you’d ever dreamed.

To balance the serif, the smaller parts of the page—navigation, dates, captions—are set in [_Source Sans 3_](https://fonts.google.com/specimen/Source+Sans+3?ref=daniel.pizza "Source Sans 3 on Google Fonts"), Paul D. Hunt’s open-source sans for Adobe. Both are bundled with the theme, so they load from the reader’s own site, not from Google.

</div>

<div class="sm:mt-32 mt-16 mb-16">
<figure class="w-full">
  {% retinaImage "src/assets/journal/literata-weights.png", "Literata’s weights, from extralight to black italic, in Latin, Greek and Cyrillic", 1200 %}
</figure>
<figure class="w-full mt-4">
  {% retinaImage "src/assets/journal/literata-character-set.png", "Literata’s Latin, Greek and Cyrillic alphabets, figures and punctuation", 1200 %}
  <figcaption class="pl-8 sm:pl-0">Literata’s weights, and part of its character set. From the <a href="https://www.type-together.com/literata-font?ref=daniel.pizza" title="Literata by TypeTogether">Literata 3 specimen</a> by TypeTogether.</figcaption>
</figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

Most of the time I spent building the theme went into small decisions you only notice when they’re wrong. A few I enjoyed making:

- **Bold at 600, not 700.** _Literata_’s bold is heavy enough to punch a hole in a paragraph. One step lighter, it still stands out but stays part of the text.
- **Paragraphs like a book.** A first-line indent instead of a blank line, justified and hyphenated. On phones the text goes ragged right, because a narrow justified column opens up [rivers](https://en.wikipedia.org/wiki/River_(typography) "River, on Wikipedia") between the words.
- **Figures that fit.** [Old-style numbers](https://en.wikipedia.org/wiki/Text_figures "Text figures, on Wikipedia") in running text, so a year sits among lowercase letters instead of standing above them (just as they do here, on my website), and lining numbers in dates and tables, where they need to line up.
- **[Small caps](https://en.wikipedia.org/wiki/Small_caps "Small caps, on Wikipedia") for acronyms**, so a word like <span class="smallcaps">NASA</span> doesn’t shout in the middle of a sentence.
- **A small square to end a post**, the [tombstone](https://en.wikipedia.org/wiki/Tombstone_(typography) "Tombstone, on Wikipedia") that magazines use, instead of an ornament. I tried a [fleuron](https://en.wikipedia.org/wiki/Fleuron_(typography) "Fleuron, on Wikipedia") first, but it was much too pleased with itself.

<figure class="w-full">
  {% retinaImage "src/assets/journal/proza-text-light.png", "Running text in Proza: justified, hyphenated, with indented paragraphs", 800 %}
</figure>
<figure class="w-full mt-4">
  {% retinaImage "src/assets/journal/proza-text-dark.png", "The same typesetting in dark mode", 800 %}
  <figcaption class="pl-8 sm:pl-0">Book-style paragraphs, in light and dark. Readers get whichever their device prefers, unless the owner of the publication chooses one specifically.</figcaption>
</figure>

Not everyone wants their publication to look like a novel, so the book settings are switches, not rules. In Ghost’s design settings you can choose spaced paragraphs or ragged text, _Times New Roman_ instead of _Literata_, and a fixed light or dark scheme. The defaults are opinionated, but they can be turned off.

## Plain Text → Proza
_Plain Text_ was the working title I had for the theme, but the theme soon outgrew it. As my friend [Đorđe](https://djordje.work/?ref=daniel.pizza "Đorđe’s website") pointed out, the name seemed to promise a brutalist site set in _Times New Roman_ with bright blue hyperlinks, and what I’d made was going in the opposite direction: quieter, more refined, much closer to a well-set book than a nostalgic website. I renamed it [Proza](https://proza.site/?ref=daniel.pizza "Proza"): Dutch for “prose”.

The [demo site](https://proza.site/?ref=daniel.pizza "The Proza demo") is set up like a small literary-ish publication, with essays, notes and pictures, so you can see the theme handle real reading rather than lorem ipsum. The pictures are all taken from the public domain: a reading wheel from an 1883 book of scientific amusements, hands from a book printed in Nuremberg in 1491, a children’s book from 1824 in which the commas have feelings. The sample essays are <span class="smallcaps">AI</span>-generated, which the site states plainly; they’re there to show how the type behaves, not to pass for my writing, or anyone else’s.

</div>

<div class="sm:mt-32 mt-16 mb-16">
<figure class="w-full">
  <div class="device-stage" style="aspect-ratio: 1404 / 900">
    <div class="device-layer" style="position: relative">
      <div class="dark:hidden">{% retinaImage "src/assets/journal/proza-phones-static-light.png", "Proza on three phones: the home page, a post, and the same post in dark mode, scrolling", 1400 %}</div>
      <div class="hidden dark:block">{% retinaImage "src/assets/journal/proza-phones-static-dark.png", "Proza on three phones in dark mode: the home page, a post, and the same post in light mode, scrolling", 1400 %}</div>
    </div>
    <div class="device-screen is-inverted" style="left: 70.477%; top: 0; width: 29.523%; height: 100%; border-radius: 3.134cqw">
      <span class="device-topfade" style="height: 4.558cqw"></span>
      <span class="device-island" style="width: 9.466cqw; height: 2.78cqw; top: 0.826cqw"></span>
      <div class="device-page" style="--distance: -59.09%">
        <div class="dark:hidden">{% retinaImage "src/assets/journal/proza-phones-page-light.png", "", 415 %}</div>
        <div class="hidden dark:block">{% retinaImage "src/assets/journal/proza-phones-page-dark.png", "", 415 %}</div>
      </div>
    </div>
  </div>
  <figcaption class="pl-8 sm:pl-0">How Proza behaves on a phone</figcaption>
</figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

Proza costs $99 (or €89), once, for one publication, with updates and email support included. You can [buy it on proza.site](https://proza.site/buy/?ref=daniel.pizza "Buy Proza"), and the [documentation](https://proza.site/docs/?ref=daniel.pizza "Proza’s documentation") is there too, if you’d like to read it first. This is the first time I’ve built a theme and made it available to the wider public, so if you notice any room for improvement in how I’ve explained things, please feel free to reach out.

## Trema remains Trema
Trema keeps its own theme, and it hasn’t stood still since that first post. In May I gave it another overhaul: larger book covers on the homepage, a more realistic shading system, different colour settings for fiction and non-fiction books, and a more immersive article page. It’s still tailored to my use case; Proza represents what I learned from making it.

</div>

<div class="sm:mt-32 mt-16 mb-16">
<figure class="w-full">
  <div class="dark:hidden">{% retinaImage "src/assets/journal/trema-light.png", "Trema on a laptop, showing The Silver Book by Olivia Laing, and on a phone, Frog and Other Essays by Anne Fadiman", 1200 %}</div>
  <div class="hidden dark:block">{% retinaImage "src/assets/journal/trema-dark.png", "Trema in dark mode on a laptop, showing The Silver Book by Olivia Laing, and on a phone, Frog and Other Essays by Anne Fadiman", 1200 %}</div>
</figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

If you’ve asked me for Trema’s theme in the past year: this one’s for you. And if you end up using it, I’d love to see what you write.

</div>
