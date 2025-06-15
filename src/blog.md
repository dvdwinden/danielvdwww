---
layout: base.njk
title: Blog
description: Useful links and resources
deleteme: true
---

# Blog

A collection of my latest writing, thoughts, and resources.

<ul class="divide-y divide-dotted divide-gray-300">
  {% for post in collections.blog %}
  <li class="py-6">
    <div class="flex items-baseline justify-between">
      <a href="{{ post.url }}" class="text-2xl font-serif font-semibold hover:underline">
        {{ post.data.title }}
      </a>
      <span class="text-xs uppercase tracking-widest text-gray-500 ml-4 whitespace-nowrap">
        {{ post.date | date('MMM yyyy') }}
      </span>
    </div>
    <p class="text-base text-gray-600 mt-1">{{ post.data.description }}</p>
  </li>
  {% endfor %}
</ul>


---

This page is regularly updated. *Last updated: June 2024*

