# Daniël van der Winden • Personal Website

A personal website and blog built with Eleventy (11ty) and styled with Tailwind. This site showcases my work, writing, and personal interest.

## Overview

This is a static site generator setup featuring:
- **Eleventy (11ty)** for static site generation
- **Tailwind CSS** with Typography plugin for styling
- **Image optimization** with responsive image shortcodes
- **Dark mode** toggle functionality
- **RSS feed** generation
- **Development workflow** with live reload

## Project Structure

```
├── src/                    # Source files
│   ├── _includes/          # Nunjucks templates
│   │   └── base.njk        # Base layout template
│   ├── assets/             # Images and static assets
│   ├── blog/               # Blog posts (markdown)
│   ├── essays/             # Essay posts (markdown)
│   ├── css/                # Generated CSS (output)
│   ├── js/                 # JavaScript files
│   ├── index.md            # Homepage content
│   ├── newsletter.md       # Newsletter page
│   ├── reading.md          # Reading list (books)
│   ├── watching.md         # Watching list (movies)
│   ├── colophon.md         # Site colophon
│   └── now.md              # Current activities
├── .eleventy.js            # Eleventy configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## Features

### Content Types
- **Work Portfolio**: Professional experience and project showcases
- **Blog Posts**: Technical writing and thoughts
- **Essays**: Long-form writing and personal reflections
- **Reading/Watching Lists**: Curated recommendations
- **Newsletter**: Monthly book recommendations (Trema)

### Design & Styling
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode**: Toggle between light and dark themes
- **Typography**: Custom font stack with serif and sans-serif options
- **Image Optimization**: Responsive images with retina support
- **Clean Layout**: Minimalist design focusing on content readability

### Technical Features
- **Collections**: Automated grouping of blog posts and essays
- **RSS Feed**: Auto-generated feed for blog posts
- **Image Shortcodes**: Custom Eleventy shortcodes for optimized images
- **Live Reload**: Development server with automatic refresh

## Development

### Prerequisites
- Node.js (recommended: latest LTS version)
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd danielvdwww

# Install dependencies
npm install
```

### Development Commands

```bash
# Start development server with live reload
npm run dev

# Build for production
npm run build

# Build CSS only
npm run build:css

# Watch CSS changes
npm run watch:css

# Serve built site
npm run serve
```

### Development Workflow

The `npm run dev` command starts both Eleventy and Tailwind CSS in watch mode using `concurrently`:
- Eleventy serves the site on `http://localhost:8080` with live reload
- Tailwind CSS watches for changes and rebuilds CSS automatically

## Configuration

### Eleventy Configuration (`.eleventy.js`)
- **Input Directory**: `src/`
- **Output Directory**: `_site/`
- **Template Formats**: Markdown, Nunjucks, HTML
- **Collections**: Blog posts and essays with date sorting
- **Image Shortcodes**: `retinaImage` for responsive images
- **RSS Feed**: Automated generation from blog posts

### Tailwind Configuration (`tailwind.config.js`)
- **Content Sources**: All source files for purging unused CSS
- **Typography Plugin**: Enhanced prose styling
- **Dark Mode**: Class-based dark mode implementation
- **Custom Colors**: Beige background and custom color palette
- **Font Families**: Custom serif and sans-serif font stacks

### Content Management

#### Adding Blog Posts
Create markdown files in `src/blog/` with frontmatter:

```markdown
---
layout: base.njk
title: "Your Post Title"
date: 2024-01-01
description: "Post description"
---

Your post content here...
```

#### Adding Essays
Create markdown files in `src/essays/` with similar frontmatter structure.

#### Images
Place images in `src/assets/` and use the `retinaImage` shortcode:

```markdown
{% retinaImage "src/assets/image.png", "Alt text", width, "additional-classes" %}
```

## Deployment

The site generates static files to the `_site/` directory. Deploy this directory to any static hosting service:

- **Netlify**: Connect your repository for automatic deployments
- **Vercel**: Import project for automatic deployments
- **GitHub Pages**: Push `_site/` contents to `gh-pages` branch
- **Any Static Host**: Upload `_site/` directory contents

### Build Command
```bash
npm run build
```

## Customization

### Colors and Theming
Modify `tailwind.config.js` to customize:
- Color palette
- Typography settings
- Spacing and layout
- Dark mode preferences

### Layout and Templates
Edit Nunjucks templates in `src/_includes/` to modify:
- Site structure
- Navigation
- Header and footer
- Content layout

### Content Structure
Modify `.eleventy.js` to:
- Add new collections
- Create custom shortcodes
- Configure additional template formats
- Add processing filters

## Dependencies

### Core Dependencies
- `@11ty/eleventy`: Static site generator
- `tailwindcss`: Utility-first CSS framework
- `@tailwindcss/typography`: Typography plugin for Tailwind
- `concurrently`: Run multiple commands simultaneously

### Development Dependencies
All dependencies are development dependencies as this generates a static site.

## License

Personal website - all rights reserved.

## Contact

- **Email**: d.vanderwinden@gmail.com
- **Website**: [daniel.pizza](https://daniel.pizza)
- **Bluesky**: [@daniel.pizza](https://bsky.app/profile/daniel.pizza)
- **LinkedIn**: [dvdwinden](https://www.linkedin.com/in/dvdwinden/)
- **GitHub**: [dvdwinden](https://github.com/dvdwinden)

---

*This README provides a comprehensive overview of the site structure, development workflow, and customization options. For specific technical questions, refer to the Eleventy and Tailwind CSS documentation.*
