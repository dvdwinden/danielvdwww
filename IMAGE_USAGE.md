# Image Optimization Guide

Your site now automatically optimizes images in the `/assets` folder for web performance.

## How it works

- Images are automatically converted to modern formats (AVIF, WebP, JPEG)
- Multiple sizes are generated (300px, 600px, 900px, 1200px, 1800px, 2400px)
- **Retina display support**: 2x pixel density images for crisp display on high-DPI screens
- Lazy loading is enabled by default
- Progressive JPEG encoding for faster perceived loading
- Responsive images serve the best size for each device

## Using images in your content

### Method 1: Using the image shortcode (recommended)

In any Markdown or Nunjucks file:

```njk
{% image "src/assets/your-image.jpg", "Alt text description" %}
```

With custom sizes:

```njk
{% image "src/assets/your-image.jpg", "Alt text", "(min-width: 768px) 50vw, 100vw" %}
```

### Method 1b: Retina-optimized images (for fixed-size images)

For images with fixed dimensions (like avatars, icons, logos):

```njk
{% retinaImage "src/assets/avatar.jpg", "User avatar", 100 %}
```

This generates 100px and 200px versions for crisp display on retina screens.

### Method 2: Using the macro helper

First import the macro:

```njk
{% from "image.njk" import img %}
```

Then use it:

```njk
{{ img("src/assets/your-image.jpg", "Alt text", "(min-width: 768px) 50vw, 100vw", "my-4") }}
```

### Method 3: Direct HTML (automatic optimization)

Regular HTML img tags pointing to `/assets/` will be automatically optimized:

```html
<img src="/assets/your-image.jpg" alt="Alt text" />
```

## Best practices

1. **Use descriptive alt text** for accessibility
2. **Choose appropriate sizes** based on how the image will be displayed
3. **Put original images in `src/assets/`** - they'll be automatically processed
4. **Use JPEG for photos**, PNG for graphics with transparency
5. **The system will handle format conversion** automatically

## Generated files

Optimized images are saved to `_site/img/` with filenames like:
- `filename-300.avif`
- `filename-300.webp` 
- `filename-300.jpeg`

## Performance benefits

- **AVIF**: Best compression, newest format
- **WebP**: Good compression, wide browser support
- **JPEG**: Fallback for older browsers
- **Responsive images**: Appropriate size loads based on device
- **Lazy loading**: Images load only when needed

