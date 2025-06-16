---
layout: base.njk
title: Links
description: Useful links and resources
deleteme: true
---

# Links

A collection of my latest writing, thoughts, and resources.

<ul class="divide-y divide-dotted divide-gray-300 blog">
  {% for post in collections.links %}
  <li class="py-3 pl-0">
    <div class="flex items-baseline justify-between">
      <a href="{{ post.url }}" class="text-2xl font-serif font-semibold hover:underline">
        {{ post.data.title }}
      </a>
      <span class="text-xs uppercase tracking-widest text-gray-500 ml-4 whitespace-nowrap font-sans">
        {{ post.date | date('MMM yyyy') }}
      </span>
    </div>
    <p class="text-base text-gray-600 mt-1 mb-0">{{ post.data.description }}</p>
  </li>
  {% endfor %}
</ul>

