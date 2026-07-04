# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal website and blog built with Eleventy (11ty) static site generator and styled with Tailwind CSS. The site features:
- Personal homepage with work experience
- Links collection (curated external content)
- Journal (original writing)
- Newsletter (monthly book recommendations)
- RSS feed generation
- Custom image optimization system with caching

## Development Commands

```bash
# Start development server with live reload
npm run dev

# Build for production
npm run build

# Build CSS only
npm run build:css

# Check for large assets (>5MB)
npm run check:assets
```

Development server runs on `http://localhost:8080` with live reload. The `dev` command runs Eleventy and Tailwind CSS in watch mode concurrently.

## Architecture & Key Concepts

### Image Processing System

The codebase features a sophisticated image optimization system in `.eleventy.js`:

- **Automatic Processing**: All images in `src/assets/` are automatically processed during build
- **WebP Conversion**: Converts all images to WebP format at widths [800, 1200, 1800]
- **Original Files**: Original images remain in `src/` but are NOT copied to `_site/` - only optimized WebP versions are deployed
- **Caching**: Two-level cache system (IMAGE_CACHE and FILE_PATH_CACHE) prevents reprocessing
- **Incremental Builds**: In CI/CD, only changed images are processed (determined via Git diff)
- **Multiple Shortcodes**:
  - `{% image src, alt, sizes %}` - Standard responsive images
  - `{% retinaImage src, alt, maxWidth %}` - Retina-optimized images (1x and 2x)
- **Transform Hook**: `optimizeImages` transform automatically processes `<img>` tags in HTML
- **Favicon Exclusion**: Files containing "favicon" or "apple-touch-icon" bypass optimization

The system converts images to WebP format at multiple widths and generates `<picture>` elements with proper srcsets. This optimization reduces deployment size from ~341MB to ~128MB (62% reduction).

### Content Structure

Content is organized by type in `src/`:

- `links/` - Markdown files with `external_url` frontmatter (curated external content)
- `journal/` - Markdown files for original writing
- `newsletter/` - Monthly book recommendation posts
- `_includes/` - Nunjucks templates (base.njk, header.njk, footer.njk, etc.)
- `assets/` - Images and static files organized by content type

### Collections & Tags

Eleventy collections are defined in `.eleventy.js`:
- `links` - Filtered by glob `src/links/*.md`, sorted by date descending
- `journal` - Filtered by glob `src/journal/*.md`, sorted by date descending
- `newsletter` - Filtered by glob `src/newsletter/*.md`, sorted by date descending
- `linkTags` - Aggregates all tags from links with slug generation
- `linkTagPages` - Pre-paginated tag pages (10 posts per page)

All collections automatically filter out drafts (`draft: true` in frontmatter).

### Template System

- **Template Engine**: Nunjucks for HTML/templates, with Markdown support
- **Base Layout**: `src/_includes/base.njk` provides the main structure
- **Narrow Layout**: `src/_includes/narrow.njk` for article-focused pages
- **Custom Filters**:
  - `removeH1` - Strips h1 tags from content (used when title is rendered separately)
  - `rssSafe` - Removes scripts and converts embeds to links for RSS
  - `date` - Formats dates using Luxon (default: "LLL yyyy")
  - `lastModified` - Gets file modification time from filesystem
  - `regexMatch` - Tests strings against regex patterns

### Styling with Tailwind

Tailwind configuration in `tailwind.config.js`:
- **Dark Mode**: Class-based (`darkMode: 'class'`)
- **Custom Colors**: beige, brown, green, stone, cream, amber, blue, red, black, hover variants, highlight, purple
- **Custom Fonts**:
  - Sans: Degular (custom webfont)
  - Serif: Blanco (custom webfont)
- **Custom Typography**: Base font size is 1.25rem (20px) with 1.5 line height
- **Font Loading**: Fonts preloaded in base.njk for performance

### Data Files

`src/_data/` contains JavaScript files that fetch data at build time:
- `githubContributions.js` - Fetches GitHub activity data
- `metadata.json` - Site metadata (title, description, URL)

Data is available in templates as global variables (e.g., `{{ githubContributions.contributionsByDate }}`).

### CI/CD Optimization

`.github/workflows/deploy.yml` implements intelligent caching:
- Caches Eleventy build artifacts and `_site/` directory
- Separate cache for processed images (keyed by asset file hashes)
- Detects changed files via Git diff to optimize builds
- Uses `--incremental` flag when no images changed and cache hit
- Sets `CHANGED_IMAGES` env var to inform Eleventy which images to process
- Always rebuilds CSS after Eleventy (TailwindCSS scans full site)

### Environment Variables

Required for API integrations (set in `.env` locally, GitHub Secrets in CI):
- `LASTFM_API_KEY` - Last.fm API access
- `LASTFM_USERNAME` - Last.fm username
- `STRAVA_CLIENT_ID` - Strava API client
- `STRAVA_CLIENT_SECRET` - Strava API secret
- `STRAVA_REFRESH_TOKEN` - Strava OAuth refresh token
- `GITHUB_TOKEN` - GitHub API access (GH_PAT in CI)

### Content Frontmatter

**Links** require:
```yaml
layout: narrow.njk
title: "Post Title"
date: YYYY-MM-DD
tags: [tag1, tag2]
external_url: "https://example.com"
bodyClass: bg-green  # Or other color
description: "Description text"
```

**Journal** require:
```yaml
layout: base.njk
title: "Post Title"
date: YYYY-MM-DDTHH:MM:SS+TZ
tags: [tag1]
bodyClass: bg-stone  # Or other color
description: "Description text"
```

## Project-Specific Patterns

### Adding Images to Content

Use the `retinaImage` shortcode in Nunjucks templates or Markdown:
```nunjucks
{% retinaImage "src/assets/journal/image.jpg", "Alt text", 800 %}
```

The system will automatically find the file even if the extension differs (tries .avif, .webp, .jpg, .jpeg, .png, .JPG, .PNG).

### Tag System

Tags are normalized to slugs for URLs (lowercase, hyphens, special chars removed). The `slugify()` function in `.eleventy.js` handles this. Tag pages are automatically generated at `/links/{tag-slug}/` with pagination.

### RSS Feed Generation

RSS feeds are generated for:
- Global feed: All content from links and journal
- Links feed: Only links content
- Journal feed: Only journal content

The `rssSafe` filter ensures feeds don't contain scripts or complex embeds.

### Directory Structure

```
src/
├── _includes/        # Nunjucks templates
├── _data/           # Build-time data fetching
├── assets/          # Images, fonts, static files
│   ├── links/       # Images for links posts
│   ├── journal/     # Images for journal posts
│   ├── newsletter/  # Images for newsletter posts
│   ├── work/        # Images for work section
│   ├── fonts/       # Custom webfonts
│   └── favicon.*    # Favicon files
├── links/           # Markdown files for links
├── journal/         # Markdown files for journal
├── newsletter/      # Markdown files for newsletter
├── js/              # Client-side JavaScript
├── css/             # Source CSS (input for Tailwind)
└── *.njk, *.md      # Pages (index, library, now, etc.)

_site/               # Build output (gitignored)
```

## Important Notes

- The image optimization system requires Node with `--max-old-space-size=4096` flag due to processing large images
- Favicons are explicitly copied via passthrough (not processed by image optimization)
- The `optimizeImages` transform runs on all HTML output to catch images not using shortcodes
- Redirects are configured in `.eleventy.js` serverOptions (`/writing/*` → `/journal/:splat`, `/reading` → `/library`)
- A `_redirects` file in `src/` handles Netlify redirects
