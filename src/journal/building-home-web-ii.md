---
layout: base.njk
title: "On building a home on the web (II)"
bodyClass: bg-stone
date: 2025-07-16T20:48:50+0000
tags: [internet, development]
description: On moving away from no-code tools to build my own website.
image:
  src: /assets/journal/daniel-pizza-2.png
  alt: "The previous version of my personal website"
  title: "On building a home on the web (II)"
---

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif pt-[25vh] dark:prose-invert">

<h1>On building a home on the web (II)</h1>
<span class="font-sans text-sm">June 25, 2025</span>

The last time I overhauled my website was in [February of 2022](/journal/building-home-web/ "My previous post on building a home on the web"). 

I'd grown weary of the _website as a business card_ that had gotten so prevalent in our industry. With the rise of social media I'd seen many truly personal websites disappear to never return (mine included), and I missed the web of years before. 

Through [posts like this one by Matthias Ott](https://matthiasott.com/articles/into-the-personal-website-verse?rel=daniel.pizza "Matthias Ott on the personal web") I learned I wasn't alone—the 1572 Webmentions below it say as much. Many wanted to move away from algorithmic timelines and back to a personal website. To regain control of their own content, to try things, to experiment, to tinker.

I wanted to do so, too, but as I outlined in my [previous piece](/journal/building-home-web/ "My previous post on building a home on the web"), I felt a little too scared. So intimidated by front-end frameworks, automatisation and optimisation, that the barrier to get started was too high—like opening a large toolbox and not knowing which bit is quite right for the job.

## No-code: lowering the barrier
It was around this time that [Framer](http://framer.com?rel=daniel.pizza "Framer") pivoted to becoming a website builder for designers. I'd gotten access to their alpha, and it got me very excited. Here was a simple, canvas-based design tool that allowed me to _build_ a responsive website by drawing rectangles—Figma, but with a _publish_ button. They handed me a nail _and_ a hammer. Easy.
</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    {% retinaImage "src/assets/journal/daniel-pizza-1.png", "The previous version of my personal website" %}
  </figure>
  <br />
   <figure class="w-full">
    {% retinaImage "src/assets/journal/daniel-pizza-2.png", "The previous version of my personal website" %}
    <figcaption class="pl-8 sm:pl-0">The previous version of my personal website.</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

I jumped at the opportunity and created myself a truly personal website. It housed the books I read, the films I watched, and the [links I collected](/links "My collected links"). I later added links to my [newsletter](/newsletter "My newsletter on books") and a [now](/now "What I'm up to now") page. My familiarity with the canvas lowered the barrier significantly. I believe I launched it within two weeks. I kept it up regularly after that, and others referenced it now and again ([1](https://projects.kwon.nyc/internet-is-fun/ "Rachel Kwon's mention of my website"), [2](https://thu-le.com/blogroll?ref=daniel.pizza "Thư Le's mention of my website")).

Shortly after that (or in parallel, or... both—and certainly not by my doing), it felt like the personal web took off again. I started seeing nicely crafted personal websites pop up everywhere (perhaps because I was looking more closely), and I tumbled down a rabbit hole, from blogroll to blogroll.

## Getting comfortable coding
Fast forward to 2024: my work at Ghost was in full swing, and I spent a lot of time writing (front-end) code. I learned more about Git, learned to work with [Tailwind](https://tailwindcss.com/?ref=daniel.pizza "Tailwind CSS") and, while the markup [isn't pretty](https://www.reddit.com/r/ProgrammerHumor/comments/1cbd630/knockknock/ "A Tailwind joke on Reddit"), it got me back to feeling comfortable building things again. 

I'll admit AI ([Cursor](http://cursor.com?ref=daniel.pizza)) helped. It jogged my memory, provided an auto-complete based on our codebase that helped me get acquainted quickly, taught me about CSS standards I wasn't familiar with, and introduced me to React or Ember patterns in such a way that I could get by building the bits of UI I needed to. ([Warp](http://warp.dev/?ref=daniel.pizza "Warp IDE") helped, too, because it takes [almost] all the scariness out of a Terminal window).

Sometime this year my studiomate [Thomas](https://thomasrohlfs.com/?ref=daniel.pizza "Thomas Rohlfs") showed me the website he built for [NoGood](https://nogood.studio/?ref=daniel.pizza "NoGood"), introducing me to [Eleventy](https://www.11ty.dev/ref=daniel.pizza "Eleventy"). He gave me a quick run-through and—given my recent experience of coding again—I realised I could build something similar. It made me rethink my usage of no-code tools. 

See, somewhere along the way I felt like I'd lost control of my Framer setup a little. I regularly had new ideas for things to add to my website, but at this point I was by no means an expert. They'd added many new things over the years—things I hadn't kept up with—and I realised I might be better off getting my hands in the code again. To learn how to build things myself in a way that is more universally applicable, rather than learning how to use one specific user interface.

The no-code tool that initially lowered the barrier for me to create had started to feel too complicated; like I was wielding that hammer while wearing two oven mitts. 
</div>

<div class="sm:mt-32 mt-16 mb-16">
   <figure class="w-full">
    {% retinaImage "src/assets/journal/daniel-pizza-3.png", "Back to basics with a static site" %}
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

## Back to basics with a static site
After leaving my role at Ghost I was going to need a new website—one that left a little more room for myself as a professional (as my friend [Timon](https://www.linkedin.com/in/timonvanreek "Timon van Reek on LinkedIn") once rightfully pointed out, “you literally have a website about your hobbies”). I decided to build it myself. 

I had Warp set up my local development environment. Rather than skimming through technical documentation and messing things up once or twice, its AI-integration helped me set up the right folder and file structure, and allowed me to get creative much faster than I normally would. 

I made one quick sketch in Figma (below) and started building immediately after (I had worked on another version [a year before](https://todays.design/dvdwinden/personal-website-v3-clvo1eynt007012xwzlneeuy1?ref=daniel.pizza "A previous sketch of my personal website"), and some of my thinking there informed this version). I'd previously earmarked [Martina Plantijn](https://klim.co.nz/retail-fonts/martina-plantijn/?ref=daniel.pizza "Martina Plantijn by Klim Type Foundry") but recently ran into [Blanco](https://www.fostertype.com/retail-type/blanco?ref=daniel.pizza "Blanco, by Foster Type") (I can't remember where), and ran with it. The typeface I use for headlines, [Degular](https://ohnotype.co/fonts/degular?ref=daniel.pizza "Degular, by Oh No Type Co."), was already on my radar for my newsletter/book blog, [Trema](http://trema.website?ref=daniel.pizza "Trema: one book recommendation, once every month"). I tested it in combination with Blanco and liked the pairing, so that stayed, too.
</div>

<div class="sm:mt-32 mt-16 mb-16">
   <figure class="w-full">
    {% retinaImage "src/assets/journal/daniel-pizza-4.png", "The sketch I made for this website" %}
    <figcaption class="pl-8 sm:pl-0">The sketch I made for this website.</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

I time-boxed my efforts to roughly a week, and while building I discovered [People and Blogs](https://peopleandblogs.com/ "People and Blogs"), curated and maintained by [Manuel Moreale](https://manuelmoreale.com/ "Manuel Moreale"). The websites featured there inspired me to keep things simple. To ship a first version quickly, to keep learning, and to improve things over time. In the end, I deployed the first version nine days after I started.

I discovered Tailwind's [typography plugin](https://github.com/tailwindlabs/tailwindcss-typography "Tailwind's typography plugin") which makes setting type with Tailwind a lot easier. I got a dark mode implementation going pretty quickly, and learned about content collections, pagination, and automatic image optimisation. I got into the [Nunjucks templating engine](https://mozilla.github.io/nunjucks/ "Nunjucks templating engine"), which is quite easy to work with, too. I still have a lot to improve (Lighthouse performance scores could be better, RSS is missing, and I need to get into [webrings](https://indieweb.org/webring?ref=daniel.pizza "Webrings")), but I'm excited to do so. 

I left a page or two behind to save time. You can no longer find _/watching_ or _/reading_ here (both previously housed three years worth of top 10s for films and books). They were personal pages, yes, but I think my [newsletter](/newsletter "Newsletter entries") collection is better suited for sharing my reading. I may bring _/watching_ back later (along with _/listening_?)—for now, give me a follow on [Letterboxd](http://letterboxd.com/dvdwinden "Follow me on Letterboxd").

Right now, this site feels like a great base. I don't feel intimidated anymore. 

I have a nail, and I have my hammer, and I am wielding it.

{% include "footer.njk" %}

</div>