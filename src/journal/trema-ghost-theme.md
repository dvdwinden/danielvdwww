---
layout: base.njk
title: "A fresh coat of paint for Trema, my publication about the books I loved reading"
bodyClass: bg-stone
date: 2025-09-08T23:06:00+02:00
tags: [design, books, internet, ghost, publishing]
description: After over two years of writing a book recommendation per month, it was time to design a new and improved reading experience.
image:
  src: /assets/journal/trema-featured-img.png
  alt: "Trema"
  title: "A fresh coat of paint for Trema, my publication about the books I loved reading"
---

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif pt-[25vh] dark:prose-invert">

<h1>A fresh coat of paint for Trema, my publication about the books I loved reading</h1>
<span class="font-sans text-sm">September 8, 2025</span>

{% retinaImage "src/assets/journal/trema-featured-img.png", "Trema", 1200 %}

In December of 2022 I started [Trema](http://trema.website?refdaniel.pizza "Trema"), a website and monthly newsletter where I could write, briefly, about the books I loved reading. Primarily, it was a way for me to practice such writing. Secondarily, I think my friends appreciated me leaving them to it, channeling my ramblings about books they must read into a centralised location they could choose to ignore. 

For a designer starting a publication, the immediate urge is to design the thing first. Make a little logo, pick a few colours, set the typography. I purposely decided against doing any of that, to begin with. My goal was to write and publish one post every month, which meant reading at least two books in four weeks; if I’d read just _one_ and couldn’t recommend it, I’d have nothing to write about (thankfully, at the time I was reading three to four books per month, so this wasn’t so daunting). 

It seemed wise to trial this for a while, to see if the habit stuck. Using [Ghost](http://ghost.org/?ref=daniel.pizza "Ghost"), I picked their standard theme, a background colour, and a common, built-in typeface, and I was off to the races. Last December, nearly two years in, I decided the habit stuck long enough for me to start thinking about properly personalising the online publication I was building. 

## A calm, warmer reading experience
Most of my readers read Trema in their email inbox. Only a fraction click through to the post on the web, and that’s fine. And yet, for those who do, I was itching to create a calm, outstanding reading experience of my own, and to learn how to build a custom [Ghost theme](https://ghost.org/themes/?ref=daniel.pizza "Ghost’s themes") in the process.

Building my personal website (this one, right here), a month or two ago, sped up some decision-making. I’d bought two typefaces for it, [_Degular_](https://ohnotype.co/fonts/degular?ref=daniel.pizza "Degular by Oh No Type Co") and [_Blanco_](https://www.fostertype.com/retail-type/blanco?ref=daniel.pizza "Blanco by Foster Type"), and immediately knew I’d be using them for Trema, too. _Degular_ works great for headlines, and has quite a bit of character when you blow it up to larger sizes; _Blanco_ is very well suited for longer texts, and reads comfortably. Using the same typefaces once more, I’d be able to create a bit of unity between both of my sites.

<figure class="w-full">
  {% retinaImage "src/assets/journal/degular-specimen.png", "A look at the Degular type specimen", 1200 %}
</figure>
<figure class="w-full mt-4">
  {% retinaImage "src/assets/journal/blanco-specimen.png", "A look at the Blanco type specimen", 1200 %}
  <figcaption class="pl-8 sm:pl-0">Examples taken from the <em>Degular</em> and <em>Blanco</em> type specimens, by Oh No Type Co. and Foster Type.</figcaption>
</figure>

While building this site, I had decided to include a page, [_/newsletter_](/newsletter "Newsletter"), where I’d link to my posts on Trema. To make that page feel warmer, I had the idea to photograph every book I’d recommended. I’d relied on digital images up until then, and I thought this change would make the page come across a tad more human, resembling a glance at my bookshelves rather than a peek at my computer’s file system. Testing this approach with some photographs, I liked the outcome, and the digital images from before immediately felt very sterile in comparison.

A few of the books that I’d read on my Kindle, I bought on paper. I photographed nearly every book myself, with one or two exceptions for the ones I still need to purchase, and added them to the page. And, immediately, the combination of the typography and photography clicked for me, informing how I wanted the heart of the publication—a book recommendation—to look. 

I’d saved screenshots of different sites over the course of a few months, building up a small reference library, but this little exploration was the final push for where I wanted to take things: big photographs of the book’s actual, beautiful _paper_ cover, flanked by large typography and a refined and legible body text.

I mocked up a little sketch in Figma and decided to start building it straight away. If I could build the heart of the publication to my liking, the rest would follow. 

</div> 

<div class="sm:mt-32 mt-16 mb-16">
<figure class="w-full">
  {% retinaImage "src/assets/journal/references-trema.png", "My references for Trema", 1200 %}
</figure>
<figure class="w-full mt-4">
  {% retinaImage "src/assets/journal/figma-sketch-trema.png", "My Figma sketch for Trema", 1200 %}
  <figcaption class="pl-8 sm:pl-0">A look at a few of the references I’d collected, and the initial Figma sketch I made for Trema.</figcaption>
</figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

Most of my time went into getting that page right. Creating a pleasing grid, breaking out of it with purpose, and making it a joy to read on a phone, too. I had a lot of fun with that (and, fortunately, roughly 30 posts to test my idea on). 

Using Ghost’s built-in tags a little creatively I could accommodate the design. Without getting overly technical: I tag every post, and its first tag is the name of the book’s author, which is then pulled out below the book’s title; the rest of the tags simply appear below the excerpt. 
</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full mt-4">
    {% retinaImage "src/assets/journal/trema-book-page.png", "The page for a book recommendation; the heart of my publication.", 1200 %}
    <figcaption class="pl-8 sm:pl-0">The template for a book recommendation; the heart of my publication.</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

## Automatically populating collections
All tags, then, are clickable, which creates space for building collections. You can now see which publishers I’ve read books from ([Fitzcarraldo Editions](https://www.trema.website/tag/fitzcarraldo-editions/?ref=daniel.pizza "Fitzcarraldo Editions on Trema") and [Canongate](https://www.trema.website/tag/canongate?ref=daniel.pizza "Canongate on Trema") lead the way), and click through to authors or years of publication, too. Here’s [Miranda July](https://www.trema.website/tag/miranda-july/?ref=daniel.pizza "Miranda July on Trema"), or [Jo Ann Beard](https://www.trema.website/tag/jo-ann-beard/?ref=daniel.pizza "Jo Ann Beard on Trema"). And, here’s [2024](https://www.trema.website/tag/2024/?ref=daniel.pizza "2024 on Trema"), or [2015](https://www.trema.website/tag/2015/?ref=daniel.pizza "2015 on Trema"). 

And, I’ve built a page that automatically populates and shows [all authors](http://trema.website/authors?ref=daniel.pizza "All authors on Trema"), in alphabetical order. 

The index I kept fairly simple, pulling out my latest few recommendations across [fiction](http://trema.website/tag/fiction?ref=daniel.pizza "Fiction on Trema") and [non-fiction](http://trema.website/tag/non-fiction?ref=daniel.pizza "Non-fiction on Trema"), and moving readers onto new things to read as quickly as possible.

</div>

<div class="sm:mt-32 mt-16 mb-16">
<figure class="w-full">
  <video autoplay loop muted playsinline class="w-full" preload="auto">
        <source src="/assets/journal/trema-clickthrough-no-padding.mp4" type="video/mp4">
        Clicking through Trema, tumbling down the rabbit hole.
    </video>
    <figcaption class="pl-8 sm:pl-0">Clicking through Trema, tumbling down the rabbit hole.</figcaption>
</figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

## Chipping away at a well-rounded publication
All of this now allows me to create a much more extensive and well-rounded publication simply by continuing to write about the books I loved reading, which I’m quite chuffed about. Collections build up automatically, deepening the potential rabbit holes readers can go down with every additional book I add; I want you to land on one of Trema’s pages, tumble down that rabbit hole, and appear out the other end with one or two new books to buy and immerse yourself in. 

To quote [Rebecca Solnit](https://www.meditationsinanemergency.com/?ref=daniel.pizza "Rebecca Solnit’s Meditations In An Emergency") (_No Straight Road Takes You There_, page 173): 
> I am a writer because I am a reader, and readers share a faith in books—in the practice of quieting down and going deep, in the power of accurate description, in the passion to understand what the meanings and possibilities this life offers us are.

## Up next: illustrations, improvements, and returning to regular publishing
In the coming months I’ll be commissioning a friend to create an illustration or two that I can intersperse in certain places, adding a bit more character to the publication without interfering with the book covers. I’m still testing the waters when it comes to functionality and responsiveness, too: if you find something that looks off on the device you’re reading Trema on, feel free to let me know via [email](mailto:d.vanderwinden@gmail.com "Send me an email") or [Bluesky](https://bsky.app/profile/daniel.pizza?ref=daniel.pizza "My profile on Bluesky"). 

None of this is ever truly finished, but it’ll serve me right for years to come. 

Throughout all this I’d parked recommending a new book for a month or two. I couldn’t fathom publishing knowing the upgraded reading experience I had up my sleeve. Now, my [latest post](https://www.trema.website/james-salter-burning-the-days/?ref=daniel.pizza "My latest post, on James Salter’s Burning The Days") went out today, and I have a few in the works for the months ahead, picking up my regular pace of publishing again from here on out. 

If you’re already a reader of Trema, I appreciate it. If not: you can [subscribe via email](https://www.trema.website/#/portal/signup?ref=daniel.pizza "Subscribe to Trema") or [follow along via RSS](https://www.trema.website/rss/ "Trema’s RSS feed").

For now, thank you for reading.

</div>