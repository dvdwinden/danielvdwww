const Image = require("@11ty/eleventy-img");
const path = require("path");
const fs = require("fs");
const { DateTime } = require("luxon");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const { glob } = require("glob");

// Cache of processed images
const IMAGE_CACHE = new Map();

// Cache to map between source paths and actual file paths with correct extensions
const FILE_PATH_CACHE = new Map();

module.exports = function (eleventyConfig) {
  // Add environment variables to global data
  eleventyConfig.addGlobalData("env", {
    NODE_ENV: process.env.NODE_ENV || "development"
  });

  // Add regexMatch filter
  eleventyConfig.addFilter("regexMatch", function (str, pattern) {
    const regex = new RegExp(pattern);
    const match = str.match(regex);
    return match ? match : null;
  });

  // Add filter to remove h1 tags from template content
  eleventyConfig.addFilter("removeH1", function (content) {
    if (!content) return content;
    // Remove h1 tags with links to external_url and title variables
    // Handle both raw and HTML-encoded versions
    return content
      .replace(/<h1><a href="{{ external_url }}">{{ title }}<\/a><\/h1>\s*/g, '')
      .replace(/<h1><a href="[^"]*">.*?<\/a><\/h1>\s*/g, '');
  });

  // Image optimization function
  // Utility function to try finding a file
  const tryFile = async (filePath) => {
    try {
      await fs.promises.access(filePath);
      return filePath;
    } catch (e) {
      return null;
    }
  };

  // Process an image and return metadata
  async function processImage(srcPath, widths = [300, 600, 900, 1200, 1800, 2400]) {
    // Already processed?
    if (IMAGE_CACHE.has(srcPath)) {
      return IMAGE_CACHE.get(srcPath);
    }

    // Get relative path without src prefix
    const relativePath = srcPath.replace(/^src\//, '');
    // Get directory and file information
    const parsedPath = path.parse(relativePath);
    // Create output directory path
    const outputDir = path.join("./_site", path.dirname(relativePath));
    // Create URL path for the processed image
    const urlPath = path.dirname(relativePath);
    // Get original filename without extension
    const originalName = path.basename(parsedPath.name);
    // Store original extension
    const originalExt = path.extname(srcPath).toLowerCase();

    // Store the mapping of source path to actual file path
    FILE_PATH_CACHE.set(relativePath, {
      originalName: originalName,
      originalExt: originalExt,
      outputDir: outputDir,
      urlPath: urlPath,
      sourcePath: srcPath
    });

    console.log(`Processing image: ${srcPath} (${originalName}${originalExt})`);

    try {
      const metadata = await Image(srcPath, {
        widths: widths,
        formats: ["avif", "webp", "jpeg"],
        outputDir: outputDir,
        urlPath: `/${urlPath}/`,
        filenameFormat: function (id, src, width, format, options) {
          // Use original filename with width and format - keep format extension
          return `${originalName}-${width}.${format}`;
        },
        sharpAvifOptions: {
          quality: 80,
          effort: 4
        },
        sharpWebpOptions: {
          quality: 80
        },
        sharpJpegOptions: {
          quality: 80,
          progressive: true
        }
      });

      // Cache the result
      IMAGE_CACHE.set(srcPath, metadata);
      return metadata;
    } catch (err) {
      console.error(`Error processing image ${srcPath}:`, err);
      return null;
    }
  }

  // Process all images in a directory
  async function processAllImages() {
    // Ensure output directories exist
    const dirs = [
      "_site/assets",
      "_site/assets/links",
      "_site/assets/journal",
      "_site/assets/newsletter",
      "_site/assets/work",
      "_site/assets/now"
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    }

    // Find all image files
    const imageExtensions = [".avif", ".webp", ".jpg", ".jpeg", ".png", ".JPG", ".PNG"];
    const imagePatterns = imageExtensions.map(ext => `src/assets/**/*${ext}`);
    const imageFiles = [];

    for (const pattern of imagePatterns) {
      const files = await glob(pattern);
      imageFiles.push(...files);
    }

    // Filter out favicon files - they should not be processed by the image optimization system
    const faviconFiles = imageFiles.filter(file => {
      const fileName = path.basename(file).toLowerCase();
      return fileName.includes('favicon') || fileName.includes('apple-touch-icon');
    });

    const filesToProcess = imageFiles.filter(file => {
      const fileName = path.basename(file).toLowerCase();
      return !fileName.includes('favicon') && !fileName.includes('apple-touch-icon');
    });

    console.log(`Found ${imageFiles.length} images to process`);
    console.log(`Excluding ${faviconFiles.length} favicon files from processing`);
    console.log(`Processing ${filesToProcess.length} images`);

    // Process each image and build a mapping of original references to processed images
    for (const file of filesToProcess) {
      try {
        // Get the relative path that would be used in markdown/html
        const relativePath = file.replace(/^src\//, '');

        // Process the image - this will also add it to the FILE_PATH_CACHE
        await processImage(file);
      } catch (err) {
        console.error(`Error processing image ${file}:`, err);
      }
    }

    console.log("Finished processing all images");
  }

  // Run before build starts
  eleventyConfig.on("beforeBuild", async () => {
    console.log("Pre-processing all images...");
    await processAllImages();
  });

  async function imageShortcode(src, alt, sizes = "(min-width: 1024px) 100vw, 50vw") {
    // Skip favicon files - they should not be processed by the image optimization system
    const fileName = path.basename(src).toLowerCase();
    if (fileName.includes('favicon') || fileName.includes('apple-touch-icon')) {
      return `<img src="${src}" alt="${alt}" title="${alt}" loading="lazy" />`;
    }

    // Extract the directory structure from the source path to maintain it in output
    // Remove leading slash if present
    const cleanSrc = src.startsWith('/') ? src.substring(1) : src;
    // Create proper path with src prefix if needed
    const srcPath = cleanSrc.startsWith('src/') ? cleanSrc : path.join('src', cleanSrc);
    // Get relative path for cache lookup
    const relativePath = srcPath.replace(/^src\//, '');

    // Check if we already have this path in the cache
    if (FILE_PATH_CACHE.has(relativePath)) {
      const pathInfo = FILE_PATH_CACHE.get(relativePath);

      // If the source path is cached and already processed, use it directly
      if (pathInfo.sourcePath && IMAGE_CACHE.has(pathInfo.sourcePath)) {
        return Image.generateHTML(IMAGE_CACHE.get(pathInfo.sourcePath), {
          alt,
          sizes,
          loading: "lazy",
          decoding: "async",
        });
      }
    }

    // Handle the case where src includes size and format suffixes
    const sizeFormatRegex = /-(\d+)\.(jpeg|jpg|png|webp|avif)$/i;
    const sizeFormatMatch = src.match(sizeFormatRegex);

    if (sizeFormatMatch) {
      // This is a reference to a sized/formatted version, extract the base path
      const basePath = src.replace(sizeFormatRegex, '');
      const baseRelativePath = basePath.startsWith('/') ? basePath.substring(1) : basePath;

      // Try to find the original file with various extensions
      const potentialExtensions = ['.avif', '.webp', '.jpg', '.jpeg', '.png', '.JPG', '.PNG'];
      for (const ext of potentialExtensions) {
        const potentialPath = path.join('src', baseRelativePath + ext);
        if (await tryFile(potentialPath)) {
          // Process with this path instead
          srcPath = potentialPath;
          break;
        }
      }
    }

    // List of possible extensions to try
    const extensions = ['.avif', '.webp', '.jpg', '.jpeg', '.png', '.JPG', '.PNG'];

    // Try to find the actual file with correct extension
    let actualFilePath = srcPath;
    if (!await tryFile(actualFilePath)) {
      // Try replacing extension
      const basePath = srcPath.replace(/\.\w+$/, '');
      for (const ext of extensions) {
        const newPath = basePath + ext;
        if (await tryFile(newPath)) {
          actualFilePath = newPath;
          break;
        }
      }
    }

    // If still can't find the file, log an error and return placeholder
    if (!await tryFile(actualFilePath)) {
      console.error(`Could not find image file: ${srcPath} (tried multiple extensions)`);
      return `<img src="${src}" alt="${alt}" title="${alt}" loading="lazy" />`;
    }

    // Check if image has already been processed
    let metadata;
    if (IMAGE_CACHE.has(actualFilePath)) {
      metadata = IMAGE_CACHE.get(actualFilePath);
    } else {
      // Process the image
      metadata = await processImage(actualFilePath);
    }
    if (!metadata) {
      console.error(`Failed to process image: ${actualFilePath}`);
      return `<img src="${src}" alt="${alt}" title="${alt}" loading="lazy" />`;
    }

    let imageAttributes = {
      alt,
      sizes,
      loading: "lazy",
      decoding: "async",
    };

    return Image.generateHTML(metadata, imageAttributes);
  }

  // Transform to automatically optimize images in content
  eleventyConfig.addTransform("optimizeImages", async function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      // Find all img tags with src pointing to assets
      // This regex matches both /assets/ and src/assets/ patterns, with any file extension
      const imgRegex = /<img\s+[^>]*src=["'](?:\/|src\/)?([^"']*\/assets\/[^"']*)["'][^>]*>/gi;
      let match;
      const processed = new Set(); // Keep track of already processed tags to avoid duplicates

      while ((match = imgRegex.exec(content)) !== null) {
        const imgTag = match[0];

        // Skip if we've already processed this exact tag
        if (processed.has(imgTag)) {
          continue;
        }
        processed.add(imgTag);

        const src = match[1];
        const altMatch = imgTag.match(/alt=["']([^"']*)["']/);
        const alt = altMatch ? altMatch[1] : "";
        const titleMatch = imgTag.match(/title=["']([^"']*)["']/);
        const title = titleMatch ? titleMatch[1] : "";

        // Skip favicon files - they should not be processed by the image optimization system
        const fileName = path.basename(src).toLowerCase();
        if (fileName.includes('favicon') || fileName.includes('apple-touch-icon')) {
          continue;
        }

        try {
          // Clean source path and create relative path for cache lookup
          const cleanSrc = src.startsWith('/') ? src.substring(1) : src;
          const srcPath = cleanSrc.startsWith('src/') ? cleanSrc : path.join('src', cleanSrc);
          const relativePath = srcPath.replace(/^src\//, '');

          // First check if we have this path in our file path cache
          if (FILE_PATH_CACHE.has(relativePath)) {
            const pathInfo = FILE_PATH_CACHE.get(relativePath);

            // Check if the source path is in the image cache
            if (pathInfo.sourcePath && IMAGE_CACHE.has(pathInfo.sourcePath)) {
              const metadata = IMAGE_CACHE.get(pathInfo.sourcePath);
              const imageAttributes = {
                alt,
                sizes: "(min-width: 1024px) 100vw, 50vw",
                loading: "lazy",
                decoding: "async",
              };
              const optimizedImg = Image.generateHTML(metadata, imageAttributes);

              // Replace all occurrences of this exact img tag
              const escapedImgTag = imgTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const replaceRegex = new RegExp(escapedImgTag, 'g');
              content = content.replace(replaceRegex, optimizedImg);
              continue;
            }
          }

          // Handle the case where the src directly includes size and format suffixes
          const sizeFormatRegex = /-(\d+)\.(jpeg|jpg|png|webp|avif)$/i;
          const sizeFormatMatch = src.match(sizeFormatRegex);

          if (sizeFormatMatch) {
            // This is a reference to a sized/formatted version, extract the base path
            const size = sizeFormatMatch[1];
            const format = sizeFormatMatch[2];
            const basePath = src.replace(sizeFormatRegex, '');

            // Try to find the base file in various formats
            const baseRelativePath = basePath.startsWith('/') ? basePath.substring(1) : basePath;
            const potentialPaths = [
              path.join('src', baseRelativePath + '.avif'),
              path.join('src', baseRelativePath + '.webp'),
              path.join('src', baseRelativePath + '.jpg'),
              path.join('src', baseRelativePath + '.jpeg'),
              path.join('src', baseRelativePath + '.png'),
              path.join('src', baseRelativePath + '.JPG'),
              path.join('src', baseRelativePath + '.PNG')
            ];

            let foundPath = null;
            for (const p of potentialPaths) {
              if (await tryFile(p)) {
                foundPath = p;
                break;
              }
            }

            if (foundPath) {
              // Process and use this image
              const optimizedImg = await imageShortcode(foundPath, alt);

              // Replace all occurrences of this exact img tag
              const escapedImgTag = imgTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const replaceRegex = new RegExp(escapedImgTag, 'g');
              content = content.replace(replaceRegex, optimizedImg);
              continue;
            }
          }

          // If direct cache lookup failed, try to find the file by trying different extensions
          let actualFilePath = srcPath;

          // Try to find file with correct extension if needed
          if (!await tryFile(actualFilePath)) {
            const extensions = ['.avif', '.webp', '.jpg', '.jpeg', '.png', '.JPG', '.PNG'];
            const basePath = srcPath.replace(/\.\w+$/, '');
            for (const ext of extensions) {
              const newPath = basePath + ext;
              if (await tryFile(newPath)) {
                actualFilePath = newPath;
                break;
              }
            }
          }

          // If we found the actual file path, process it
          if (actualFilePath && await tryFile(actualFilePath)) {
            // Process the image using the imageShortcode which will cache it
            const optimizedImg = await imageShortcode(actualFilePath, alt);

            // Replace all occurrences of this exact img tag
            const escapedImgTag = imgTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const replaceRegex = new RegExp(escapedImgTag, 'g');
            content = content.replace(replaceRegex, optimizedImg);
          } else {
            // If we still can't find the file, log a warning and use the original tag
            console.warn(`Could not find image file for transform: ${src}`);

            // Just keep the original tag
            continue;
          }
        } catch (err) {
          console.warn(`Failed to optimize image: ${src}`, err.message);
          console.error(err);
        }
      }
    }
    return content;
  });

  // Retina-optimized image shortcode
  async function retinaImageShortcode(src, alt, maxWidth = 600) {
    // Skip favicon files - they should not be processed by the image optimization system
    const fileName = path.basename(src).toLowerCase();
    if (fileName.includes('favicon') || fileName.includes('apple-touch-icon')) {
      return `<img src="${src}" alt="${alt}" title="${alt}" loading="lazy" />`;
    }

    // Extract the directory structure from the source path to maintain it in output
    // Remove leading slash if present
    const cleanSrc = src.startsWith('/') ? src.substring(1) : src;
    // Create proper path with src prefix if needed
    const srcPath = cleanSrc.startsWith('src/') ? cleanSrc : path.join('src', cleanSrc);
    // Get relative path for cache lookup
    const relativePath = srcPath.replace(/^src\//, '');

    // Check if we already have this path in the cache
    if (FILE_PATH_CACHE.has(relativePath)) {
      const pathInfo = FILE_PATH_CACHE.get(relativePath);

      // If the source path is cached and already processed, use it directly
      if (pathInfo.sourcePath && IMAGE_CACHE.has(pathInfo.sourcePath)) {
        let cachedMetadata = IMAGE_CACHE.get(pathInfo.sourcePath);

        // Filter to only include retina sizes
        const formats = Object.keys(cachedMetadata);
        const filteredMetadata = {};

        for (const format of formats) {
          filteredMetadata[format] = cachedMetadata[format].filter(item =>
            item.width === maxWidth || item.width === maxWidth * 2);
        }

        return Image.generateHTML(filteredMetadata, {
          alt,
          sizes: `${maxWidth}px`,
          loading: "lazy",
          decoding: "async",
        });
      }
    }

    // Handle the case where src includes size and format suffixes
    const sizeFormatRegex = /-(\d+)\.(jpeg|jpg|png|webp|avif)$/i;
    const sizeFormatMatch = src.match(sizeFormatRegex);

    if (sizeFormatMatch) {
      // This is a reference to a sized/formatted version, extract the base path
      const basePath = src.replace(sizeFormatRegex, '');
      const baseRelativePath = basePath.startsWith('/') ? basePath.substring(1) : basePath;

      // Try to find the original file with various extensions
      const potentialExtensions = ['.avif', '.webp', '.jpg', '.jpeg', '.png', '.JPG', '.PNG'];
      for (const ext of potentialExtensions) {
        const potentialPath = path.join('src', baseRelativePath + ext);
        if (await tryFile(potentialPath)) {
          // Process with this path instead
          srcPath = potentialPath;
          break;
        }
      }
    }

    // List of possible extensions to try
    const extensions = ['.avif', '.webp', '.jpg', '.jpeg', '.png', '.JPG', '.PNG'];

    // Try to find the actual file with correct extension
    let actualFilePath = srcPath;
    if (!await tryFile(actualFilePath)) {
      // Try replacing extension
      const basePath = srcPath.replace(/\.\w+$/, '');
      for (const ext of extensions) {
        const newPath = basePath + ext;
        if (await tryFile(newPath)) {
          actualFilePath = newPath;
          break;
        }
      }
    }

    // If still can't find the file, log an error and return placeholder
    if (!await tryFile(actualFilePath)) {
      console.error(`Could not find image file for retina: ${srcPath} (tried multiple extensions)`);
      return `<img src="${src}" alt="${alt}" title="${alt}" loading="lazy" />`;
    }

    // Check if image has already been processed
    let metadata;
    if (IMAGE_CACHE.has(actualFilePath)) {
      metadata = IMAGE_CACHE.get(actualFilePath);

      // Filter to only include retina sizes if needed
      const formats = Object.keys(metadata);
      for (const format of formats) {
        metadata[format] = metadata[format].filter(item =>
          item.width === maxWidth || item.width === maxWidth * 2);
      }
    } else {
      // Process the image with retina sizes
      metadata = await processImage(actualFilePath, [maxWidth, maxWidth * 2]);
    }

    if (!metadata) {
      console.error(`Failed to process retina image: ${actualFilePath}`);
      return `<img src="${src}" alt="${alt}" title="${alt}" loading="lazy" />`;
    }

    let imageAttributes = {
      alt,
      sizes: `${maxWidth}px`,
      loading: "lazy",
      decoding: "async",
    };

    return Image.generateHTML(metadata, imageAttributes);
  }

  // Add RSS plugin
  eleventyConfig.addPlugin(pluginRss);

  // Add the shortcodes
  eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);
  eleventyConfig.addNunjucksAsyncShortcode("retinaImage", retinaImageShortcode);
  eleventyConfig.addLiquidShortcode("image", imageShortcode);
  eleventyConfig.addLiquidShortcode("retinaImage", retinaImageShortcode);
  eleventyConfig.addJavaScriptFunction("image", imageShortcode);
  eleventyConfig.addJavaScriptFunction("retinaImage", retinaImageShortcode);

  // Copy static files
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");

  // Copy favicon files to assets directory
  eleventyConfig.addPassthroughCopy("src/assets/favicon.ico");
  eleventyConfig.addPassthroughCopy("src/assets/favicon-16x16.png");
  eleventyConfig.addPassthroughCopy("src/assets/favicon-32x32.png");
  eleventyConfig.addPassthroughCopy("src/assets/apple-touch-icon.png");
  eleventyConfig.addPassthroughCopy("src/assets/favicon.png");

  // Don't passthrough asset directories since they're handled by the image optimization
  // Only passthrough files that should not be optimized
  eleventyConfig.addPassthroughCopy("src/assets/**/*.mp4");
  eleventyConfig.addPassthroughCopy("src/assets/**/*.pdf");

  // Copy fonts directory for custom fonts
  eleventyConfig.addPassthroughCopy("src/assets/fonts");

  // Make sure original images are also available
  eleventyConfig.addPassthroughCopy({
    "src/assets/links": "assets/links",
    "src/assets/journal": "assets/journal",
    "src/assets/newsletter": "assets/newsletter",
    "src/assets/work": "assets/work",
    "src/assets/now": "assets/now"
  });

  // Copy _redirects file for Netlify redirects
  eleventyConfig.addPassthroughCopy("src/_redirects");

  // Copy favicon.ico to root directory for default browser behavior
  eleventyConfig.addPassthroughCopy({ "src/assets/favicon.ico": "favicon.ico" });

  // Watch CSS files and assets for changes
  eleventyConfig.addWatchTarget("./src/css/");
  eleventyConfig.addWatchTarget("./src/assets/");

  // Add a custom shortcode to support image paths in markdown
  eleventyConfig.addShortcode("markdownImage", function (src, alt, title) {
    // Handle image paths for both with and without leading slash
    if (src.includes('/assets/') || src.includes('assets/')) {
      // This is just a placeholder that will be replaced by the transform
      return `<img src="${src}" alt="${alt || ''}" title="${title || ''}" />`;
    } else {
      // Return the original image tag for non-asset images
      return `<img src="${src}" alt="${alt || ''}" title="${title || ''}" />`;
    }
  });

  // Add a function to help with debugging image paths
  eleventyConfig.addFilter("debugImagePath", function (src) {
    if (!src) return "No source provided";

    const cleanSrc = src.startsWith('/') ? src.substring(1) : src;
    const srcPath = cleanSrc.startsWith('src/') ? cleanSrc : path.join('src', cleanSrc);

    try {
      const stats = fs.statSync(srcPath);
      return `File exists: ${srcPath} (${stats.size} bytes)`;
    } catch (e) {
      return `File not found: ${srcPath}`;
    }
  });

  // Ignore _site directory to prevent infinite loops
  eleventyConfig.ignores.add("_site/**");
  eleventyConfig.ignores.add("_site/");

  // Create collection for links
  eleventyConfig.addCollection("links", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/links/*.md")
      .filter(item => !item.data.draft)
      .sort((a, b) => b.date - a.date);
  });

  // Create collection for journal
  eleventyConfig.addCollection("journal", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/journal/*.md")
      .filter(item => !item.data.draft)
      .sort((a, b) => b.date - a.date);
  });

  // Create collection for newsletter
  eleventyConfig.addCollection("newsletter", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/newsletter/*.md").sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addFilter("date", (dateObj, format = "LLL yyyy") => {
    return DateTime.fromJSDate(dateObj).toFormat(format);
  });


  // Set up redirects from /writing/* to /journal/* both for local dev and production
  eleventyConfig.setServerOptions({
    domdiff: false,
    port: 8080,
    redirects: {
      "/writing/*": "/journal/:splat",
    }
  });

  // Add a custom markdown-it renderer to handle image processing in markdown files
  const markdownIt = require("markdown-it");
  const markdownItOptions = {
    html: true,
    breaks: true,
    linkify: true
  };

  const markdownLib = markdownIt(markdownItOptions).disable('image');

  // Add custom image renderer
  markdownLib.renderer.rules.image = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const srcIndex = token.attrIndex('src');
    const src = token.attrs[srcIndex][1];
    const altIndex = token.attrIndex('alt');
    const alt = altIndex >= 0 ? token.attrs[altIndex][1] : '';
    const titleIndex = token.attrIndex('title');
    const title = titleIndex >= 0 ? token.attrs[titleIndex][1] : '';

    // For assets, generate image tag that will be picked up by transform
    if (src.includes('/assets/') || src.includes('assets/')) {
      return `<img src="${src}" alt="${alt}" title="${title}" />`;
    } else {
      // For other images, return standard HTML
      return `<img src="${src}" alt="${alt}" title="${title}" />`;
    }
  };

  eleventyConfig.setLibrary("md", markdownLib);

  // We don't need to create directories explicitly anymore - the beforeBuild event will handle this

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    pagination: {
      links: {
        size: 10,
        alias: "links"
      },
      journal: {
        size: 10,
        alias: "journal"
      },
      newsletter: {
        size: 5,
        alias: "newsletter"
      }
    }

  };
};

