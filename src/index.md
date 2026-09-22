---
layout: base.njk
title: Designer, writer, reader
description: Designer in Amsterdam. I design software at Enode, previously Ghost and Bakken & Bæck. I write Trema, a monthly newsletter about books worth reading.
bodyClass: bg-blue
---

<div class="relative w-full max-w-lg ml-auto prose prose-lg font-serif lg:pt-[12.5vh] pt-[6vh] dark:prose-invert main-content">

<h1 class="home-subtitle mt-0 text-black dark:text-white">Designer, writer, reader.</h1>

<span class="callout">I care about the story as much as the typography it’s set in.</span>

For over a decade I’ve worked on digital products, websites and web apps: software for energy retailers, furniture makers, financial institutions and robotics companies. For journalists, designers and consumers. I’m as comfortable putting together a briefing as I am polishing an interaction; I can do the work, or build and lead the team, as I have <a href="#resume" title="Jump to my resumé">for years</a>.

  {# Contact card, parked for now. Uncomment to bring it back. #}
  {# {% include "contact-card.njk" %} #}

</div>

<div class="sm:mt-16 mt-8 sm:mb-16 mb-8">
  <figure class="figure-cycle w-full" style="--cycle-ratio: 2 / 1">
    <div class="figure-cycle-frames">
      <div class="figure-cycle-frame">{% image "src/assets/work/enode-social-icon.png", "The Enode icon" %}</div>
      <div class="figure-cycle-frame">{% image "src/assets/work/enode-logo.png", "The Enode logo" %}</div>
      <div class="figure-cycle-frame">
        <video autoplay loop muted playsinline preload="metadata" aria-label="A home with solar panels, a heat pump and an EV charging in the garage">
          <source src="/assets/work/enode-home.webm" type="video/webm" />
          <source src="/assets/work/enode-home.mp4" type="video/mp4" />
        </video>
      </div>
      <div class="figure-cycle-frame">{% image "src/assets/work/enode-type.png", "Enode Sans and Enode Mono, the brand’s typefaces" %}</div>
      <div class="figure-cycle-frame">{% image "src/assets/work/enode-next-grid.png", "“The Next Grid”" %}</div>
      <div class="figure-cycle-frame">{% image "src/assets/work/enode-invisible-enabler.png", "“We’re the invisible enabler of a connected energy system.”" %}</div>
      <div class="figure-cycle-frame">
        <video autoplay loop muted playsinline preload="metadata" aria-label="The enabler grid: a field of dots blooming in waves">
          <source src="/assets/work/enode-enabler-dark.webm" type="video/webm" />
          <source src="/assets/work/enode-enabler-dark.mp4" type="video/mp4" />
        </video>
      </div>
      <div class="figure-cycle-frame">
        <!-- mp4 only: VP9 lands 33% heavier than h264 on this dark, near-flat
             diagram, so a webm here would cost every browser that prefers it. -->
        <video autoplay loop muted playsinline preload="metadata" aria-label="The five layers of the Enode platform, stacked and turning">
          <source src="/assets/work/enode-platform.mp4" type="video/mp4" />
        </video>
      </div>
      <div class="figure-cycle-frame">
        <video autoplay loop muted playsinline preload="metadata" aria-label="A pan across the home energy coordination diagram">
          <source src="/assets/work/enode-hec.webm" type="video/webm" />
          <source src="/assets/work/enode-hec.mp4" type="video/mp4" />
        </video>
      </div>
      <div class="figure-cycle-frame">{% image "src/assets/work/enode-icons.png", "Icons for the Enode platform" %}</div>
      <div class="figure-cycle-frame">
        <video autoplay loop muted playsinline preload="metadata" aria-label="An aerial view at dusk of homes connected to the energy grid">
          <source src="/assets/work/enode-grid.webm" type="video/webm" />
          <source src="/assets/work/enode-grid.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
    <figcaption>Outtakes from the Enode rebrand, in collaboration with <a href="https://oker.com?ref=daniel.pizza" title="Studio Oker" rel="external" target="_blank">Studio Oker</a></figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif dark:prose-invert">

<section class="introduction">

At [Enode](https://enode.com?ref=daniel.pizza "Enode") I mostly design software for energy retailers and traders. This year, though, I led our rebrand: giving shape to how the company looks and sounds, and designing and building its new website from scratch.

{% bookmark
  url="https://enode.com?ref=daniel.pizza",
  title="Enode: Orchestrating energy for the next grid",
  description="One platform for energy retailers and the teams that trade for them.
    Connect every asset, coordinate every home, and shape thousands as one.",
  icon="icons/logos/enode-mark.svg",
  label="Enode"
%}

_Before Enode I designed publishing tools at [Ghost](https://ghost.org?ref=daniel.pizza "Ghost"), and spent nine years at <a href="https://bakkenbaeck.com?ref=daniel.pizza" title="Bakken &amp; Bæck" rel="nofollow" target="_blank">Bakken & Bæck</a>—the last four as Partner and <span class="smallcaps">CDO</span>, moulding the company into what it (hopefully still) is today._

</section>

---

<h2 class="section-title">Trema</h2>

Outside of my day job I write [Trema](https://www.trema.website?ref=daniel.pizza "Trema, my monthly newsletter about books"), a monthly newsletter about the books I loved reading. Through short posts, I recommend fiction and non-fiction for casual and voracious readers.

<ul class="trema-list not-prose">
{%- for post in collections.newsletter.slice(0, 3) %}
  {%- set cover = post.data.external_url | tremaCover(trema.covers) %}
  <li class="trema-item book-item"><div class="book-cover">{% if cover %}<img src="{{ cover }}" alt="{{ post.data.image.alt }}" loading="lazy" decoding="async">{% else %}{% image "src" + post.data.image.src, post.data.image.alt, "186px" %}{% endif %}</div><a href="{{ post.data.external_url }}" title="{{ post.data.title }}" target="_blank" rel="external">{{ post.data.title }}</a><span class="trema-date">{{ post.data.date | date("MMM yyyy") | upper }}</span></li>
{%- endfor %}
</ul>

<p class="trema-more"><a href="/newsletter" title="Every entry from Trema">Read all {{ collections.newsletter.length }}</a></p>

{% bookmark
  url="/journal/trema-ghost-theme/",
  title="A fresh coat of paint for Trema, my publication about the books I loved reading",
  description="After over two years of writing a book recommendation per month,
    it was time to design a new and improved reading experience.",
  label="A fresh coat of paint for Trema"
%}

---

<h2 class="section-title"><em>TRANSCRIPT</em> Magazine</h2>

With [Iris Cuppen](https://iriscuppen.com?ref=daniel.pizza "Iris Cuppen") I curated, edited, designed and published four issues of _TRANSCRIPT_, a small literary magazine. We commissioned essays, short stories and poetry, alongside visual work by designers, illustrators or photographers.

Each launch was accompanied by live readings, each issue printed in a limited run and sold online or in select bookstores.

<figure class="w-full sm:max-w-lg ml-auto my-8">
  <picture>{% retinaImage "src/assets/work/transcript-scribe.png", "TRANSCRIPT Magazine", 512 %}</picture>
</figure>

{% bookmark
  url="https://transcriptmag.store?ref=daniel.pizza",
  title="TRANSCRIPT Magazine",
  description="A seasonal literary magazine of essays, short stories and poetry,
    printed in a limited run. Four issues, 2023–2025.",
  icon="/assets/icons/transcript-favicon.png"
%}

---

<h2 class="section-title">NoGood art book</h2>

In 2026 I wrote and edited the NoGood art book, taking Thomas Rohlfs’ musings about his life and work, and turning them into a cohesive whole. A gentle introduction to his moniker through a foreword and a few chapters covering how it came to be, why it’s the perfect place for him to experiment and grow his practice, and where it might be headed next.

</div>

<div class="sm:mt-16 mt-8 sm:mb-16 mb-8">
  <figure class="figure-cycle w-full">
    <div class="figure-cycle-frames">
      <div class="figure-cycle-frame">{% image "src/assets/journal/nogood02.jpg", "The NoGood art book" %}</div>
      <div class="figure-cycle-frame">{% image "src/assets/journal/nogood03.jpg", "The NoGood art book" %}</div>
      <div class="figure-cycle-frame">{% image "src/assets/journal/nogood04.jpg", "The NoGood art book" %}</div>
      <div class="figure-cycle-frame">{% image "src/assets/journal/nogood05.jpg", "The NoGood art book" %}</div>
      <div class="figure-cycle-frame">{% image "src/assets/journal/nogood06.jpg", "The NoGood art book" %}</div>
    </div>
    <figcaption>Photography by <a href="https://www.lilialuganskaia.com/?ref=daniel.pizza" title="Lilia Luganskaia-Kuilder" rel="nofollow" target="_blank">Lilia Luganskaia-Kuilder</a></figcaption>
  </figure>
</div>

<div class="w-full max-w-lg ml-auto prose prose-lg font-serif dark:prose-invert">

I enjoyed our collaboration very much, and wrote a few words about it in my journal. I look forward to taking on more, similar work—writing, editing, or both.

{% bookmark
  url="/journal/nogood-book/",
  title="Writing the NoGood book",
  description="A gentle introduction to my friend Thomas’s moniker, NoGood—an exercise
    in restraint, written through hours of conversation. The book is out now."
%}

---

<section class="resume" id="resume">
  <h2 class="work-title">Resumé</h2>
  <div class="entry-list flex flex-col">
    <div class="flex items-baseline border-b border-black/10 dark:border-white/10">
      <span class="text-xs uppercase tracking-widest text-gray-500 mr-6 w-24 shrink-0 whitespace-nowrap font-sans">2025–now</span>
      <p class="my-4">Senior Product Designer at <a href="https://enode.com/?ref=daniel.pizza" title="Enode" target="_blank" rel="external">Enode</a></p>
    </div>
    <div class="flex items-baseline border-b border-black/10 dark:border-white/10">
      <span class="text-xs uppercase tracking-widest text-gray-500 mr-6 w-24 shrink-0 whitespace-nowrap font-sans">2025</span>
      <p class="my-4">Senior Product Designer at <a href="https://fictivekin.com?ref=daniel.pizza" title="Fictive Kin" rel="external" target="_blank">Fictive Kin</a><span class="resume-note">Contract</span></p>
    </div>
    <div class="flex items-baseline border-b border-black/10 dark:border-white/10">
      <span class="text-xs uppercase tracking-widest text-gray-500 mr-6 w-24 shrink-0 whitespace-nowrap font-sans">2023–2025</span>
      <p class="my-4">Co-Founder of <a href="https://transcriptmag.store?ref=daniel.pizza" title="TRANSCRIPT Magazine" rel="nofollow" target="_blank"><em>TRANSCRIPT</em> Magazine</a></p>
    </div>
    <div class="flex items-baseline border-b border-black/10 dark:border-white/10">
      <span class="text-xs uppercase tracking-widest text-gray-500 mr-6 w-24 shrink-0 whitespace-nowrap font-sans">2023–2025</span>
      <p class="my-4">Senior Product Designer at <a href="https://ghost.org?ref=daniel.pizza" title="Ghost" rel="nofollow" target="_blank">Ghost</a></p>
    </div>
    <div class="flex items-baseline border-b border-black/10 dark:border-white/10">
      <span class="text-xs uppercase tracking-widest text-gray-500 mr-6 w-24 shrink-0 whitespace-nowrap font-sans">2019–2023</span>
      <p class="my-4">Partner and <span class="smallcaps">CDO</span> at <a href="https://bakkenbaeck.com?ref=daniel.pizza" title="Bakken &amp; Bæck" rel="nofollow" target="_blank">Bakken &amp; Bæck</a></p>
    </div>
    <div class="flex items-baseline border-b border-black/10 dark:border-white/10">
      <span class="text-xs uppercase tracking-widest text-gray-500 mr-6 w-24 shrink-0 whitespace-nowrap font-sans">2015–2019</span>
      <p class="my-4">Designer and Head of <span class="smallcaps">AMS</span> at <a href="https://bakkenbaeck.com?ref=daniel.pizza" title="Bakken &amp; Bæck" rel="nofollow" target="_blank">Bakken &amp; Bæck</a></p>
    </div>
    <div class="flex items-baseline border-b border-black/10 dark:border-white/10">
      <span class="text-xs uppercase tracking-widest text-gray-500 mr-6 w-24 shrink-0 whitespace-nowrap font-sans">2014–2015</span>
      <p class="my-4">Designer at <a href="https://fabrique.nl?ref=daniel.pizza" title="Fabrique" rel="nofollow" target="_blank">Fabrique</a></p>
    </div>
    <div class="flex items-baseline">
      <span class="text-xs uppercase tracking-widest text-gray-500 mr-6 w-24 shrink-0 whitespace-nowrap font-sans">2013–2014</span>
      <p class="my-4">Internships at <a href="https://fabrique.nl?ref=daniel.pizza" title="Fabrique" rel="nofollow" target="_blank">Fabrique</a> and <a href="https://bakkenbaeck.com?ref=daniel.pizza" title="Bakken &amp; Bæck" rel="nofollow" target="_blank">Bakken &amp; Bæck</a></p>
    </div>
  </div>
</section>

  <h2 class="work-title">Speaking</h2>

  <figure class="photo-tinted"><picture>{% image "src/assets/work/daniel-square@2x.webp", "Me, speaking at a launch", "(min-width: 640px) 512px, 100vw" %}</picture></figure>

  <div class="entry-list flex flex-col">
    <div class="flex items-baseline border-b border-black/10 dark:border-white/10">
      <span class="text-xs uppercase tracking-widest text-gray-500 mr-6 w-24 shrink-0 whitespace-nowrap font-sans">OCT 2025</span>
      <p class="my-4"><em>TRANSCRIPT</em> Magazine launch, issue four<sup class="entry-note-marker">*</sup></p>
    </div>
    <div class="flex items-baseline border-b border-black/10 dark:border-white/10">
      <span class="text-xs uppercase tracking-widest text-gray-500 mr-6 w-24 shrink-0 whitespace-nowrap font-sans">JUL 2025</span>
      <p class="my-4">
        <em>On Attention &amp; Intention</em>, <a href="https://www.linkedin.com/feed/update/urn:li:activity:7345825584481988610/?ref=daniel.pizza" title="Adyen Studio Day" rel="external" target="_blank">Adyen Studio Day</a></p>
    </div>
    <div class="flex items-baseline border-b border-black/10 dark:border-white/10">
      <span class="text-xs uppercase tracking-widest text-gray-500 mr-6 w-24 shrink-0 whitespace-nowrap font-sans">JUN 2025</span>
      <p class="my-4"><em>TRANSCRIPT</em> Magazine launch, issue three<sup class="entry-note-marker">*</sup></p>
    </div>
    <div class="flex items-baseline border-b border-black/10 dark:border-white/10">
      <span class="text-xs uppercase tracking-widest text-gray-500 mr-6 w-24 shrink-0 whitespace-nowrap font-sans">JAN 2025</span>
      <p class="my-4">
        <em>The Waffle King of Norway</em>, <a href="https://www.seanchoiche.com/?ref=daniel.pizza" title="Seanchoíche" rel="external" target="_blank">Seanchoíce</a>
       </p>
    </div>
    <div class="flex items-baseline border-b border-black/10 dark:border-white/10">
      <span class="text-xs uppercase tracking-widest text-gray-500 mr-6 w-24 shrink-0 whitespace-nowrap font-sans">JAN 2025</span>
      <p class="my-4"><em>TRANSCRIPT</em> Magazine launch, issue two<sup class="entry-note-marker">*</sup></p>
    </div>
    <div class="flex items-baseline">
      <span class="text-xs uppercase tracking-widest text-gray-500 mr-6 w-24 shrink-0 whitespace-nowrap font-sans">SEP 2024</span>
      <p class="my-4"><em>TRANSCRIPT</em> Magazine launch, issue one<sup class="entry-note-marker">*</sup></p>
    </div>
  </div>

  <p class="mt-6 font-sans text-sm leading-snug tracking-wide text-black/50 dark:text-white/50"><span class="entry-note-marker">*</span> With <a href="https://iriscuppen.com?ref=daniel.pizza" title="Iris Cuppen" rel="external" target="_blank">Iris Cuppen</a>.</p>
</div>
