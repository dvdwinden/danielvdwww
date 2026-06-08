---
layout: narrow.njk
title: "The old typography is new again"
date: 2026-06-08T11:20:00+02:00
tags: [design, typography]
external_url: https://adobe.design/ideas/the-old-typography-is-new-again?ref=daniel.pizza
bodyClass: bg-green
description: Elliot Jay Stocks on optical sizing and how variable fonts quietly restore the craft.
image:
  src: /assets/links/the-old-typography-is-new-again.jpg
  alt: "An oversized lowercase ‘h’ with min/max sliders illustrating an optical-size axis"
  title: "The old typography is new again"
---

<h1><a href="{{ external_url }}">{{ title }}</a></h1>

{% retinaImage "src/assets/links/the-old-typography-is-new-again.jpg", "An oversized lowercase ‘h’ with min/max sliders illustrating an optical-size axis" %}

> For five centuries, every typeface size was its own unique design. What we now call optical sizing—the practice of adapting a typeface’s design for different sizes to keep it readable—is a modern attempt to preserve that deliberate design choice to honor size-specific type, even though the physical reasons for it no longer apply.

A nice reminder by Elliot Jay Stocks on optical sizing in typography, and how variable fonts quietly restore this craft. Using `opsz`, the browser already maps `font-size` to the right optical size for you, but you can take it one step further and tweak it by hand for different resolutions (as Elliot has done on his [personal website](https://elliotjaystocks.com/?ref=daniel.pizza)).

Similar to his, my site uses Oh No Type Co’s _Degular_ too, and I have optical sizing enabled as well. You’ll see it render differently in page titles than it does in the inline `opsz` here in the body copy.
