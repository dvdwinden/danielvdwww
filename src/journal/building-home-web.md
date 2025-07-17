---
layout: base.njk
title: "On building a home on the web (I)"
bodyClass: bg-stone
date: 2022-02-25
tags: [internet, development]
description: About the decline & revival of the personal website, and on the progress our tools have made.
image:
  src: /assets/journal/fun-personal-websites.avif
  alt: "The websites of Jeffrey Zeldman (2004), Jason Santa Maria (2008), and Jessica Hische (2012)."
  title: "On building a home on the web (I)"
---

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif pt-[25vh] dark:prose-invert">

<h1>On building a home on the web (I)</h1>
<span class="font-sans text-sm">February 25, 2022</span>

It’s been five years since I’ve created myself an actual, personal website.

Years ago, I staked out a corner of the internet and made it my own, chipping away at an online presence day by day. Growing up online—I've learned of the term “nethead” [only recently](https://twitter.com/JoshSchoen/status/1481920039406415872?s=20&t=asLsUq7JjhAwppYPeembnA "A tweet by Joshua Schoenaker")—I’d find someone’s website and follow the trail of breadcrumbs they left: links to interesting publications, tiny blogs that served an even tinier niche, or websites built by their friends. I'd be picking everything apart along the way. Mozilla’s Firebug was the only tool I was truly comfortable with at the time: my trusted companion, allowing me to inspect a website's skeleton—how it was built, how its typography was done (usually with sIFR), or how a particular piece of layout or an animation was constructed. CSS was in its infancy, CSS Zen Garden represented the crème de la crème of what was possible on the web, and everyone built on one another’s work.

I remember following people like [Jason Santa Maria](https://jasonsantamaria.com/ "Jason Santa Maria"), [Ethan Marcotte](https://ethanmarcotte.com/ "Ethan Marcotte") and [Jeffrey Zeldman](https://www.zeldman.com/ "Jeffrey Zeldman"), or the likes of [Dan Mall](https://danmall.com/ "Dan Mall"), [Jessica Hische](https://jessicahische.is/ "Jessica Hische") and [Chris Shiflett](https://shiflett.org/ "Chris Shiflett") (Europe wasn't very well represented in my bubble at the time). Their websites were never done, and every couple of weeks or months they’d release a new version implementing what they’d discovered—fun new features or ideas—and leave the previous version accessible for picking apart, a trail zig-zagging across various iterations of their home on the Internet.
</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    {% retinaImage "src/assets/journal/building-home-web.avif", "The websites of Jeffrey Zeldman (2004), Jason Santa Maria (2008), and Jessica Hische (2012)." %}
    <figcaption class="pl-8 sm:pl-0">The websites of Jeffrey Zeldman (2004), Jason Santa Maria (2008), and Jessica Hische (2012).</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

Websites like these consisted, usually, of a combination of people's work and interests, with the latter taking centre stage. They housed a few projects, a collection of blog posts—long or very short—and otherwise revolved around things you’d stumble upon in one’s physical living room: movies, music, books, or other things of particular significance. 

Stumbling upon these websites was a bit like walking into their physical house, leaving your shoes by the door and, glass in hand, taking a peek at the spines of their books, their record collection, the picture frames on the wall, or the tidbits they displayed on the sideboard.

The website was, itself, a playground: an online space where the maker could play and put into practice what they’d learned or found. Personal websites were a place for fun and experimentation.

Web design (and development) as a profession in those days was still a little novel and, over the years, the field matured quickly. People dabbling with web design & development found jobs doing what they loved and “made their hobby their work”. The web became more professional and we, as tinkerers, shifted away from experimentation with personal websites—we had jobs to do now! 

Consequently, personal websites moved away from the digital equivalent of a living room, and started inching closer to a digital business card.

The technology we used to build things on the web matured greatly (phew) but, as Frank Chimero outlined in his excellent essay [_Everything Easy Is Hard Again_](https://frankchimero.com/blog/2018/everything-easy/ "Frank Chimero's essay, Everything Easy is Hard Again"), made things a lot more difficult for the casual builder. A lot more _serious_.

Where previously the web was filled with websites that prioritised play and experimentation, it became more and more important to build things right—or at least, that was implied. Long CSS and JavaScript were frowned upon; everything needed to be minimised for the sake of performance. Peeking under the hood of one's creation became more difficult (and perhaps also frowned upon?). We needed to compress, compile and continuously deploy: the personal website became an example of how you’d tackle a project had it been briefed to you by a paying customer. None of this is inherently bad—the web grew up and so should our methods—but the barrier for play rose significantly. 

If you weren't doing things the right way, you may as well not have been doing them at all. 

With the rise of social media, our personal websites went stale or disappeared altogether. We started bundling our things on Tumblr, or Twitter, or Medium,  (or ... _Ello_?) and used our websites to aggregate a handful of links to wherever we were present. These platforms were built for publishing after all, and slinging things into a feed was easy. Creating and maintaining a _good_ website was not.

<figure class="w-full">
  {% retinaImage "src/assets/journal/personal-websites-siteinspire.avif", "The “personal websites” category on Siteinspire, with two additions in the past year." %}
  <figcaption class="pl-8 sm:pl-0">The “personal websites” category on Siteinspire, with two additions in the past year.</figcaption>
</figure>

It's as if our social media profiles became where we could flaunt our personality, depending on the platform (_if you want hot takes, see my Twitter! For lukewarm takes, browse my LinkedIn!_). As if professional achievements couldn't be mixed with personality or personal interests, the personal website morphed into a bit of a billboard: two sentences about what we do, a resumé, and a list of clients. It felt as if our personality and sense of experimentation needed to disappear from the web unless someone paid us to show it.

**We stopped making websites for the sake of playing with websites.** 
But, recently, I've felt the web change.

After years of using centralised services made for publishing our content, it looks like we've grown weary and realised the platforms we've trusted with our thoughts and stories aren't going to stick around forever; we may as well take matters back into our own hands. Something that started, perhaps, with the uptick in newsletter subscriptions through Substack and Revue.

This rise in newsletter subscriptions hints at feed-fatigue, even if an email inbox is hardly that different from a newsfeed. We crave a more personal connection with both our audience and those we follow, and want more ownership over what it is we create. Perhaps the pandemic has spurred us on, caused us to reflect on the endless scrolling, and helped us realize the ~~middlemen~~ platforms aren't _absolutely necessary_.

That is to say, I'm seeing personality seep back into the web. 

I've seen websites as reading lists ([Thijs](https://thijs.niks.nu/ "Thijs Niks"), [Mandy](https://aworkinglibrary.com/ "Mandy Brown")) or personal operating systems ([Brian](https://brianlovin.com/ "Brian Lovin"), [Rauno](https://rauno.me/ "Rauno Freiberg")), websites that house obsessions ([Folkert](https://folkert.link/ "Folkert Gorter")) or  ... whatever we shall call [Aneta's](https://www.seksyplanety.com/ "Seksy Planety") fun-lovin' website: things are getting personal again!
</div>

<div class="sm:mt-32 mt-16 mb-16">
  <figure class="w-full">
    {% retinaImage "src/assets/journal/fun-personal-websites.avif", "The websites of Brian Lovin, Folkert Gorter and Aneta Junkova." %}
    <figcaption class="pl-8 sm:pl-0">The websites of Brian Lovin, Folkert Gorter and Aneta Junkova.</figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif sm:mt-24 mt-16 dark:prose-invert">

The tools we have access to as designers have matured, and evolved to a point where they make creating and maintaining an online personality—not a business card—easier than ever. By not having to obsess over the nuts and bolts of a website as much, the bar for experimentation and expression has been lowered significantly. For someone who only codes occasionally (like me), building a website no longer has to be daunting, and there are many tools to choose from: link together a few pages in a [Figma](http://figma.com/prototyping "Figma") prototype and point a domain to it; drag and drop components using your phone, on [Universe](https://onuniverse.com/ "Universe"); design a website on the canvas and click one button to publish it, with [Framer](http://framer.com "Framer"); or, use what feels like the web's Photoshop to build a fully functioning online platform, using [Webflow](https://webflow.com "Webflow")— this should allow everyone to more easily use our websites as a medium again, instead of leaving them to be a dead end because we dread the process or don't have the full technical knowhow.

**I feel comfortable experimenting again.** \
And with that, this is a first version of my new, personal website. Reimagining my “personal website” has lingered in my mind for more than a year. I designed and built it with [Framer Sites](http://framer.com "Framer Sites") over the course of a few days. Framer Sites is still in beta, but using it has been a relief. As someone who spends most of the workweek managing design work and people, keeping up with development practices isn't something that comes natural. Not having to think about “what new framework to use” or “how to deploy The Thing”, and just moving from a familiar canvas to a published website in a matter of seconds was an absolute delight. It lowered the bar by an incredible amount and allowed me to just get cracking - to feel that playful experimentation I used to feel. The code isn't great (as my partner, a senior software engineer, pointed out)—but it's a stepping stone. I have (long-lost) experience with front-end development, but I hope future experimenting with this site might push me to tinker with React.

As for the website itself, it focuses on the _person first, the occupation second_ (a philosophy Nick Cave explained [much more beautifully](https://www.youtube.com/watch?v=kWivlKQyxjU "Nick Cave")). On here, you can find the books that stuck with me from year to year, and the films that left a mark. I've created a page to collect [links](/links "Links") to my favourite newsletters, tools, articles and people, which serves as a blog without the necessity of actually writing blog posts. There's a page where you can read a bit about me and, soon, I may just add a page to show you what I've done for a living over the past years. For now, you can find that on [Read.CV](http://read.cv/danielvdw "ReadCV").

So, welcome to my reimagined home, to my corner of the Internet. Please do leave your shoes by the door. I hope you find something new you can appreciate and, if you'd like to reach out, do so via [email](d.vanderwinden@gmail.com "Email me") or [Twitter](http://x.com/dvdwinden "DM me on Twitter"). 

Thank you for reading, \
Daniël.

</div>