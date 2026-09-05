require('dotenv').config();

const Image = require("@11ty/eleventy-img");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { DateTime } = require("luxon");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const { glob } = require("glob");

// ============================================================================
// SHARED CONSTANTS
// ============================================================================

const SUPPORTED_IMAGE_EXTENSIONS = ['.avif', '.webp', '.jpg', '.jpeg', '.png', '.JPG', '.PNG'];
const OUTPUT_FORMAT = 'webp';
const DEFAULT_WIDTHS = [800, 1200, 1800];
// "Breakout" images escape the ~512px prose column and span the wide
// max-w-[1400px] container, so on a 2x display they need up to ~2800px to stay
// sharp. These widths/sizes are applied automatically to any image whose
// nearest max-width ancestor is the wide container (see optimizeImages).
const BREAKOUT_WIDTHS = [800, 1200, 1800, 2800];
const BREAKOUT_SIZES = "(min-width: 1024px) min(1400px, calc(100vw - 544px)), calc(100vw - 48px)";

// ============================================================================
// CACHES
// ============================================================================

// Cache of processed images
const IMAGE_CACHE = new Map();

// Cache to map between source paths and actual file paths with correct extensions
const FILE_PATH_CACHE = new Map();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Check if a file is a favicon (should skip image optimization)
function isFaviconFile(filePath) {
  const fileName = path.basename(filePath).toLowerCase();
  return fileName.includes('favicon') || fileName.includes('apple-touch-icon');
}

// Return a simple img tag for files that shouldn't be optimized
function getFallbackImageTag(src, alt) {
  return `<img src="${src}" alt="${alt}" title="${alt}" loading="lazy" />`;
}

// Try to find a file, returns the path if it exists or null
async function tryFile(filePath) {
  try {
    await fs.promises.access(filePath);
    return filePath;
  } catch (e) {
    return null;
  }
}

// Find the actual file path by trying different extensions
async function findFileWithExtension(basePath) {
  // First try the path as-is
  if (await tryFile(basePath)) {
    return basePath;
  }
  // Try replacing extension with each supported extension
  const pathWithoutExt = basePath.replace(/\.\w+$/, '');
  for (const ext of SUPPORTED_IMAGE_EXTENSIONS) {
    const candidatePath = pathWithoutExt + ext;
    if (await tryFile(candidatePath)) {
      return candidatePath;
    }
  }
  return null;
}

// Clean and normalize a source path for processing
function normalizeSrcPath(src) {
  const cleanSrc = src.startsWith('/') ? src.substring(1) : src;
  const srcPath = cleanSrc.startsWith('src/') ? cleanSrc : path.join('src', cleanSrc);
  const relativePath = srcPath.replace(/^src\//, '');
  return { cleanSrc, srcPath, relativePath };
}

module.exports = function (eleventyConfig) {
  // Add environment variables to global data
  eleventyConfig.addGlobalData("env", {
    NODE_ENV: process.env.NODE_ENV || "development",
    LASTFM_API_KEY: process.env.LASTFM_API_KEY || "",
    LASTFM_USERNAME: process.env.LASTFM_USERNAME || "dvdwinden"
  });

  // Add regexMatch filter
  eleventyConfig.addFilter("regexMatch", function (str, pattern) {
    const regex = new RegExp(pattern);
    const match = str.match(regex);
    return match ? match : null;
  });

  // Add filter to remove h1 tags and date spans from template content
  eleventyConfig.addFilter("removeH1", function (content) {
    if (!content) return content;
    // Remove h1 tags - both plain h1 tags and h1 tags with links
    // Handle links posts (h1 with external link) and journal posts (plain h1)
    // Also remove date spans that follow h1 tags
    return content
      .replace(/<h1><a href="{{ external_url }}">{{ title }}<\/a><\/h1>\s*/g, '') // Template variables
      .replace(/<h1><a href="[^"]*">.*?<\/a><\/h1>\s*/g, '') // Rendered links
      .replace(/<h1[^>]*>.*?<\/h1>\s*/g, '') // Any remaining h1 tags (journal posts)
      .replace(/<span[^>]*class="[^"]*font-sans[^"]*"[^>]*>.*?<\/span>\s*/g, ''); // Date spans
  });

  // Add filter to make content RSS-safe by removing scripts and replacing embeds with links
  eleventyConfig.addFilter("rssSafe", function (content) {
    if (!content) return content;
    // Remove Strava embeds and scripts, replace with plain link
    return content
      .replace(/<div class="strava-embed-placeholder"[^>]*data-embed-id="([^"]+)"[^>]*><\/div>\s*<script[^>]*><\/script>/g,
        '<p><a href="https://www.strava.com/activities/$1">View activity on Strava</a></p>')
      // Remove any other script tags as a safety measure
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  });

  // Process an image and return metadata
  async function processImage(srcPath, widths = DEFAULT_WIDTHS) {
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
        formats: ["webp"],
        outputDir: outputDir,
        urlPath: `/${urlPath}/`,
        filenameFormat: function (id, src, width, format, options) {
          // Use original filename with width and format - keep format extension
          return `${originalName}-${width}.${format}`;
        },
        sharpWebpOptions: {
          quality: 70
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

  // Process an image at a specific set of widths (for per-image overrides).
  // Unlike processImage(), this does not short-circuit on the default-widths
  // cache, so it can generate additional widths (e.g. a retina variant) for a
  // single image without affecting any other image.
  async function processImageWidths(srcPath, widths) {
    const relativePath = srcPath.replace(/^src\//, '');
    const parsedPath = path.parse(relativePath);
    const outputDir = path.join("./_site", path.dirname(relativePath));
    const urlPath = path.dirname(relativePath);
    const originalName = path.basename(parsedPath.name);

    try {
      return await Image(srcPath, {
        widths: widths,
        formats: ["webp"],
        outputDir: outputDir,
        urlPath: `/${urlPath}/`,
        filenameFormat: function (id, src, width, format) {
          return `${originalName}-${width}.${format}`;
        },
        sharpWebpOptions: {
          quality: 70
        }
      });
    } catch (err) {
      console.error(`Error processing image ${srcPath} at custom widths:`, err);
      return null;
    }
  }

  // Check if an image needs processing based on modification times
  function needsProcessing(srcPath) {
    try {
      // In CI environments, check if we're in GitHub Actions
      const isCI = process.env.CI === 'true';
      const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

      if (isGitHubActions) {
        // In GitHub Actions, rely on Git to tell us what changed
        // since _site directory is always fresh
        const changedFiles = process.env.CHANGED_IMAGES;

        if (changedFiles === '') {
          // Empty string means no image changes detected
          console.log(`⚡ Skipping ${srcPath} (no image changes in this commit)`);
          return false;
        }

        if (changedFiles && changedFiles !== 'full_build') {
          const relativePath = srcPath.replace(/^src\//, '');
          const relativeWithSrc = `src/${relativePath}`;
          const needsWork = changedFiles.includes(relativeWithSrc);
          if (!needsWork) {
            console.log(`⚡ Skipping ${srcPath} (not in changed files list)`);
          }
          return needsWork;
        }

        // Fallback: if no environment variable or 'full_build', assume we need to process
        // (this will happen on first run or manual dispatch)
        console.log(`🔄 Processing ${srcPath} (full build or manual dispatch)`);
        return true;
      }

      // Local development: use file modification times
      const srcStats = fs.statSync(srcPath);
      const relativePath = srcPath.replace(/^src\//, '');
      const parsedPath = path.parse(relativePath);
      const outputDir = path.join("./_site", path.dirname(relativePath));
      const originalName = path.basename(parsedPath.name);

      // Check if any of the output files exist and are newer than source
      for (const width of DEFAULT_WIDTHS) {
        const outputFile = path.join(outputDir, `${originalName}-${width}.${OUTPUT_FORMAT}`);
        if (fs.existsSync(outputFile)) {
          const outputStats = fs.statSync(outputFile);
          // If output is newer than source, no need to process
          if (outputStats.mtime > srcStats.mtime) {
            return false;
          }
        }
      }

      // If we get here, either no output files exist or source is newer
      return true;
    } catch (err) {
      // If there's any error checking, assume we need to process
      return true;
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
    const imagePatterns = SUPPORTED_IMAGE_EXTENSIONS.map(ext => `src/assets/**/*${ext}`);
    const imageFiles = [];

    for (const pattern of imagePatterns) {
      const files = await glob(pattern);
      imageFiles.push(...files);
    }

    // Filter out favicon files - they should not be processed by the image optimization system
    const faviconFiles = imageFiles.filter(isFaviconFile);
    const filesToProcess = imageFiles.filter(file => !isFaviconFile(file));

    // Filter to only process images that have changed or don't have output
    const filesToActuallyProcess = filesToProcess.filter(file => {
      const needsWork = needsProcessing(file);
      if (!needsWork) {
        console.log(`⚡ Skipping ${file} (already processed and up to date)`);
      }
      return needsWork;
    });

    console.log(`Found ${imageFiles.length} total images`);
    console.log(`Excluding ${faviconFiles.length} favicon files from processing`);
    console.log(`${filesToProcess.length} images eligible for processing`);
    console.log(`🚀 Processing ${filesToActuallyProcess.length} changed/new images`);
    console.log(`⚡ Skipping ${filesToProcess.length - filesToActuallyProcess.length} unchanged images`);

    // Process each image that needs processing
    for (const file of filesToActuallyProcess) {
      try {
        console.log(`🔄 Processing: ${file}`);
        // Get the relative path that would be used in markdown/html
        const relativePath = file.replace(/^src\//, '');

        // Process the image - this will also add it to the FILE_PATH_CACHE
        await processImage(file);
      } catch (err) {
        console.error(`Error processing image ${file}:`, err);
      }
    }

    // For skipped files, need to populate both FILE_PATH_CACHE and IMAGE_CACHE
    // so that shortcodes can use existing processed images without reprocessing
    for (const file of filesToProcess.filter(f => !filesToActuallyProcess.includes(f))) {
      const relativePath = file.replace(/^src\//, '');
      const parsedPath = path.parse(relativePath);
      const outputDir = path.join("./_site", path.dirname(relativePath));
      const urlPath = path.dirname(relativePath);
      const originalName = path.basename(parsedPath.name);
      const originalExt = path.extname(file).toLowerCase();

      FILE_PATH_CACHE.set(relativePath, {
        originalName: originalName,
        originalExt: originalExt,
        outputDir: outputDir,
        urlPath: urlPath,
        sourcePath: file
      });

      // Load existing processed images into IMAGE_CACHE
      try {
        const metadata = { [OUTPUT_FORMAT]: [] };

        for (const width of DEFAULT_WIDTHS) {
          const outputFile = path.join(outputDir, `${originalName}-${width}.${OUTPUT_FORMAT}`);
          if (fs.existsSync(outputFile)) {
            const stats = fs.statSync(outputFile);
            metadata[OUTPUT_FORMAT].push({
              format: OUTPUT_FORMAT,
              width: width,
              height: Math.round(width * 0.75), // Approximate aspect ratio
              filename: `${originalName}-${width}.${OUTPUT_FORMAT}`,
              outputPath: outputFile,
              url: `/${urlPath}/${originalName}-${width}.${OUTPUT_FORMAT}`,
              sourceType: `image/${OUTPUT_FORMAT}`,
              srcset: `/${urlPath}/${originalName}-${width}.${OUTPUT_FORMAT} ${width}w`,
              size: stats.size
            });
          }
        }

        // Only add to cache if we found actual processed images
        const hasValidImages = Object.keys(metadata).some(format =>
          metadata[format] && metadata[format].length > 0
        );

        if (hasValidImages) {
          IMAGE_CACHE.set(file, metadata);
          console.log(`💾 Loaded cached metadata for ${file}`);
        }
      } catch (err) {
        console.warn(`Could not load cached metadata for ${file}:`, err.message);
      }
    }

    if (filesToActuallyProcess.length === 0) {
      console.log("✨ All images are up to date!");
    } else {
      console.log(`✅ Finished processing ${filesToActuallyProcess.length} images`);
    }
  }

  // Run before build starts
  eleventyConfig.on("beforeBuild", async () => {
    console.log("Pre-processing all images...");
    await processAllImages();
  });

  async function imageShortcode(src, alt, sizes = "(min-width: 1024px) 100vw, 50vw") {
    // Skip favicon files
    if (isFaviconFile(src)) {
      return getFallbackImageTag(src, alt);
    }

    // Normalize path
    let { srcPath, relativePath } = normalizeSrcPath(src);

    // Check if we already have this path in the cache
    if (FILE_PATH_CACHE.has(relativePath)) {
      const pathInfo = FILE_PATH_CACHE.get(relativePath);
      if (pathInfo.sourcePath && IMAGE_CACHE.has(pathInfo.sourcePath)) {
        return Image.generateHTML(IMAGE_CACHE.get(pathInfo.sourcePath), {
          alt,
          sizes,
          loading: "lazy",
          decoding: "async",
        });
      }
    }

    // Handle the case where src includes size and format suffixes (e.g., image-800.webp)
    const sizeFormatRegex = /-(\d+)\.(jpeg|jpg|png|webp|avif)$/i;
    const sizeFormatMatch = src.match(sizeFormatRegex);
    if (sizeFormatMatch) {
      const basePath = src.replace(sizeFormatRegex, '');
      const baseRelativePath = basePath.startsWith('/') ? basePath.substring(1) : basePath;
      const foundPath = await findFileWithExtension(path.join('src', baseRelativePath));
      if (foundPath) {
        srcPath = foundPath;
      }
    }

    // Try to find the actual file with correct extension
    const actualFilePath = await findFileWithExtension(srcPath);
    if (!actualFilePath) {
      console.error(`Could not find image file: ${srcPath} (tried multiple extensions)`);
      return getFallbackImageTag(src, alt);
    }

    // Check if image has already been processed
    const metadata = IMAGE_CACHE.has(actualFilePath)
      ? IMAGE_CACHE.get(actualFilePath)
      : await processImage(actualFilePath);

    if (!metadata) {
      console.error(`Failed to process image: ${actualFilePath}`);
      return getFallbackImageTag(src, alt);
    }

    return Image.generateHTML(metadata, {
      alt,
      sizes,
      loading: "lazy",
      decoding: "async",
    });
  }

  // Transform to automatically optimize images in content
  eleventyConfig.addTransform("optimizeImages", async function (content, outputPath) {
    if (!outputPath || !outputPath.endsWith(".html")) {
      return content;
    }

    // Find all img tags with src pointing to assets
    const imgRegex = /<img\s+[^>]*src=["'](?:\/|src\/)?([^"']*\/assets\/[^"']*)["'][^>]*>/gi;
    let match;
    const processed = new Set();
    // Classify wide "breakout" images up front (from the original DOM) so they
    // can be given a higher-resolution retina variant.
    const breakoutTags = findBreakoutImageTags(content);

    while ((match = imgRegex.exec(content)) !== null) {
      const imgTag = match[0];
      const matchStart = match.index;

      // Skip if we've already processed this exact tag
      if (processed.has(imgTag)) continue;
      processed.add(imgTag);

      // Skip if inside a picture element (already processed by shortcode)
      const beforeImg = content.substring(0, matchStart);
      const lastPictureOpen = beforeImg.lastIndexOf('<picture');
      const lastPictureClose = beforeImg.lastIndexOf('</picture>');
      if (lastPictureOpen > lastPictureClose && lastPictureOpen !== -1) continue;

      const src = match[1];
      const altMatch = imgTag.match(/alt=["']([^"']*)["']/);
      const alt = altMatch ? altMatch[1] : "";

      // Skip favicon files
      if (isFaviconFile(src)) continue;

      try {
        // Wide "breakout" images escape the narrow prose column and span the
        // max-w-[1400px] container, so they need a higher-resolution variant
        // (up to 2800px) and an accurate sizes attribute to stay sharp on
        // high-density displays. Everything else falls through to the standard
        // optimization below, unchanged.
        if (breakoutTags.has(imgTag)) {
          const { srcPath: bSrcPath, relativePath: bRel } = normalizeSrcPath(src);
          let bFilePath = (FILE_PATH_CACHE.has(bRel) && FILE_PATH_CACHE.get(bRel).sourcePath)
            ? FILE_PATH_CACHE.get(bRel).sourcePath
            : null;
          if (!bFilePath) {
            // The rendered src is usually a size-suffixed webp (e.g. foo-800.webp);
            // strip the suffix to find the original source file.
            const suffixRegex = /-(\d+)\.(jpeg|jpg|png|webp|avif)$/i;
            if (suffixRegex.test(src)) {
              const basePath = src.replace(suffixRegex, '').replace(/^\//, '');
              bFilePath = await findFileWithExtension(path.join('src', basePath));
            }
            if (!bFilePath) bFilePath = await findFileWithExtension(bSrcPath);
          }
          if (bFilePath) {
            // eleventy-img never upscales, so a width larger than the source is
            // simply dropped. To capture every source's full usable resolution
            // (up to the 2800px retina target) we add a clamped top width based
            // on the actual source dimensions.
            let widths = BREAKOUT_WIDTHS;
            try {
              const { width: srcW } = await sharp(bFilePath).metadata();
              if (srcW) {
                const topWidth = Math.min(2800, srcW);
                widths = [...new Set([...BREAKOUT_WIDTHS, topWidth])]
                  .filter(w => w <= srcW)
                  .sort((a, b) => a - b);
              }
            } catch (e) { /* fall back to BREAKOUT_WIDTHS */ }
            const metadata = await processImageWidths(bFilePath, widths);
            if (metadata && hasValidMetadata(metadata)) {
              const optimizedImg = Image.generateHTML(metadata, {
                alt,
                sizes: BREAKOUT_SIZES,
                loading: "lazy",
                decoding: "async",
              });
              // Wrap in <picture> so it is treated as already-processed and not
              // re-optimized back to the narrow-column defaults.
              content = replaceImgTag(content, imgTag, `<picture>${optimizedImg}</picture>`);
              continue;
            }
          }
        }

        const { srcPath, relativePath } = normalizeSrcPath(src);

        // Check file path cache first
        if (FILE_PATH_CACHE.has(relativePath)) {
          const pathInfo = FILE_PATH_CACHE.get(relativePath);
          if (pathInfo.sourcePath && IMAGE_CACHE.has(pathInfo.sourcePath)) {
            const optimizedImg = Image.generateHTML(IMAGE_CACHE.get(pathInfo.sourcePath), {
              alt,
              sizes: "(min-width: 1024px) 100vw, 50vw",
              loading: "lazy",
              decoding: "async",
            });
            content = replaceImgTag(content, imgTag, optimizedImg);
            continue;
          }
        }

        // Handle size/format suffixed paths (e.g., image-800.webp)
        const sizeFormatRegex = /-(\d+)\.(jpeg|jpg|png|webp|avif)$/i;
        const sizeFormatMatch = src.match(sizeFormatRegex);
        if (sizeFormatMatch) {
          const basePath = src.replace(sizeFormatRegex, '');
          const baseRelativePath = basePath.startsWith('/') ? basePath.substring(1) : basePath;
          const foundPath = await findFileWithExtension(path.join('src', baseRelativePath));
          if (foundPath) {
            const optimizedImg = await imageShortcode(foundPath, alt);
            content = replaceImgTag(content, imgTag, optimizedImg);
            continue;
          }
        }

        // Try to find the file with correct extension
        const actualFilePath = await findFileWithExtension(srcPath);
        if (actualFilePath) {
          const optimizedImg = await imageShortcode(actualFilePath, alt);
          content = replaceImgTag(content, imgTag, optimizedImg);
        } else {
          console.warn(`Could not find image file for transform: ${src}`);
        }
      } catch (err) {
        console.warn(`Failed to optimize image: ${src}`, err.message);
      }
    }
    return content;
  });

  // Helper to replace an img tag in content
  function replaceImgTag(content, imgTag, replacement) {
    const escapedImgTag = imgTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return content.replace(new RegExp(escapedImgTag, 'g'), replacement);
  }

  // Determine which <img> tags are "breakout" images: those whose nearest
  // max-width ancestor is the wide content container rather than the narrow
  // max-w-lg prose column. Done with a stack scan of the rendered HTML so it
  // mirrors the DOM the browser builds (including the early-</div> pattern that
  // lets a figure escape the prose column). Returns a Set of the exact <img …>
  // tag strings so the transform can give them a higher-resolution variant.
  function findBreakoutImageTags(content) {
    const breakout = new Set();
    const tagRegex = /<(\/?)(div|figure|main|section|article)\b([^>]*)>|<img\b[^>]*>/gi;
    const stack = [];
    let m;
    while ((m = tagRegex.exec(content)) !== null) {
      const token = m[0];
      // An <img …> token (no capture group 2) — classify against the stack.
      if (m[2] === undefined) {
        if (!/\ssrc=["'][^"']*\/assets\//i.test(token)) continue;
        // Nearest ancestor that carries an explicit max-width.
        for (let i = stack.length - 1; i >= 0; i--) {
          const mw = stack[i].cls.match(/max-w-(?:lg|\[[^\]]+\])/g);
          if (mw) {
            if (mw[mw.length - 1] !== 'max-w-lg') breakout.add(token);
            break;
          }
        }
        continue;
      }
      const closing = m[1] === '/';
      const tag = m[2].toLowerCase();
      if (closing) {
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i].tag === tag) { stack.splice(i, 1); break; }
        }
      } else {
        const cls = (m[3].match(/class=["']([^"']*)["']/) || [])[1] || '';
        stack.push({ tag, cls });
      }
    }
    return breakout;
  }

  // Filter metadata to only include specific widths (for retina images)
  function filterMetadataByWidths(metadata, widths) {
    const filtered = {};
    for (const format of Object.keys(metadata)) {
      filtered[format] = metadata[format].filter(item => widths.includes(item.width));
    }
    return filtered;
  }

  // Check if metadata has any valid images
  function hasValidMetadata(metadata) {
    return Object.keys(metadata).some(format =>
      metadata[format] && metadata[format].length > 0
    );
  }

  // Retina-optimized image shortcode
  async function retinaImageShortcode(src, altOrWidth, maxWidth) {
    // Handle different parameter combinations:
    // retinaImageShortcode(src, alt, maxWidth) - traditional 3 params
    // retinaImageShortcode(src, maxWidth) - 2 params where second is width
    let alt, finalMaxWidth;
    if (typeof altOrWidth === 'number' && maxWidth === undefined) {
      alt = '';
      finalMaxWidth = altOrWidth;
    } else {
      alt = altOrWidth || '';
      finalMaxWidth = maxWidth || 800;
    }

    const retinaWidths = [finalMaxWidth, finalMaxWidth * 2];

    // Skip favicon files
    if (isFaviconFile(src)) {
      return getFallbackImageTag(src, alt);
    }

    // Normalize path
    let { srcPath, relativePath } = normalizeSrcPath(src);

    // Check file path cache first
    if (FILE_PATH_CACHE.has(relativePath)) {
      const pathInfo = FILE_PATH_CACHE.get(relativePath);
      if (pathInfo.sourcePath && IMAGE_CACHE.has(pathInfo.sourcePath)) {
        const filtered = filterMetadataByWidths(IMAGE_CACHE.get(pathInfo.sourcePath), retinaWidths);
        if (hasValidMetadata(filtered)) {
          return Image.generateHTML(filtered, {
            alt,
            sizes: `${finalMaxWidth}px`,
            loading: "lazy",
            decoding: "async",
          });
        }
      }
    }

    // Handle size/format suffixed paths (e.g., image-800.webp)
    const sizeFormatRegex = /-(\d+)\.(jpeg|jpg|png|webp|avif)$/i;
    if (sizeFormatRegex.test(src)) {
      const basePath = src.replace(sizeFormatRegex, '');
      const baseRelativePath = basePath.startsWith('/') ? basePath.substring(1) : basePath;
      const foundPath = await findFileWithExtension(path.join('src', baseRelativePath));
      if (foundPath) {
        srcPath = foundPath;
      }
    }

    // Find actual file with correct extension
    const actualFilePath = await findFileWithExtension(srcPath);
    if (!actualFilePath) {
      console.error(`Could not find image file for retina: ${srcPath}`);
      return getFallbackImageTag(src, alt);
    }

    // Get or process metadata
    let metadata;
    if (IMAGE_CACHE.has(actualFilePath)) {
      const filtered = filterMetadataByWidths(IMAGE_CACHE.get(actualFilePath), retinaWidths);
      metadata = hasValidMetadata(filtered)
        ? filtered
        : await processImage(actualFilePath, retinaWidths);
    } else {
      metadata = await processImage(actualFilePath, retinaWidths);
    }

    if (!metadata || !hasValidMetadata(metadata)) {
      console.error(`Failed to process retina image: ${actualFilePath}`);
      return getFallbackImageTag(src, alt);
    }

    return Image.generateHTML(metadata, {
      alt,
      sizes: `${finalMaxWidth}px`,
      loading: "lazy",
      decoding: "async",
    });
  }

  // Add RSS plugin
  eleventyConfig.addPlugin(pluginRss);

  // Register shortcodes for all template engines
  function registerAsyncShortcode(name, fn) {
    eleventyConfig.addNunjucksAsyncShortcode(name, fn);
    eleventyConfig.addLiquidShortcode(name, fn);
    eleventyConfig.addJavaScriptFunction(name, fn);
  }
  registerAsyncShortcode("image", imageShortcode);
  registerAsyncShortcode("retinaImage", retinaImageShortcode);

  // Copy static files
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");

  // Copy favicon files to assets directory
  eleventyConfig.addPassthroughCopy("src/assets/favicon.ico");
  eleventyConfig.addPassthroughCopy("src/assets/favicon-16x16.png");
  eleventyConfig.addPassthroughCopy("src/assets/favicon-32x32.png");
  eleventyConfig.addPassthroughCopy("src/assets/apple-touch-icon.png");
  eleventyConfig.addPassthroughCopy("src/assets/favicon.png");

  // Copy hero images referenced in CSS
  eleventyConfig.addPassthroughCopy("src/assets/work/daniel-square.webp");
  eleventyConfig.addPassthroughCopy("src/assets/work/daniel-square@2x.webp");
  eleventyConfig.addPassthroughCopy("src/assets/work/studio-square.webp");
  eleventyConfig.addPassthroughCopy("src/assets/work/studio-square@2x.webp");

  // Don't passthrough asset directories since they're handled by the image optimization
  // Only passthrough files that should not be optimized
  eleventyConfig.addPassthroughCopy("src/assets/**/*.mp4");
  eleventyConfig.addPassthroughCopy("src/assets/**/*.pdf");

  // Copy fonts directory for custom fonts
  eleventyConfig.addPassthroughCopy("src/assets/fonts");

  // Copy _redirects file for Netlify redirects
  eleventyConfig.addPassthroughCopy("src/_redirects");

  // Copy robots.txt for SEO
  eleventyConfig.addPassthroughCopy("src/robots.txt");

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
    return collectionApi.getFilteredByGlob("src/newsletter/*.md")
      .filter(item => !item.data.draft)
      .sort((a, b) => b.date - a.date);
  });

  // Helper function to create URL-friendly slug from tag name
  function slugify(str) {
    return str
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/&/g, '-and-')   // Replace & with 'and'
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-');  // Replace multiple - with single -
  }

  // Create collection for link tags
  eleventyConfig.addCollection("linkTags", function (collectionApi) {
    const links = collectionApi.getFilteredByGlob("src/links/*.md")
      .filter(item => !item.data.draft);

    const tagMap = {};

    links.forEach(item => {
      const tags = item.data.tags;
      if (!tags) return;

      // Normalize tags to array if it's a string or already an array
      const tagArray = Array.isArray(tags) ? tags : [tags];

      tagArray.forEach(tag => {
        const trimmedTag = tag.trim();
        const slug = slugify(trimmedTag);

        if (!tagMap[slug]) {
          tagMap[slug] = {
            name: trimmedTag,
            slug: slug,
            posts: []
          };
        }
        tagMap[slug].posts.push(item);
      });
    });

    // Sort posts within each tag by date (newest first)
    Object.keys(tagMap).forEach(slug => {
      tagMap[slug].posts.sort((a, b) => b.date - a.date);
    });

    // Convert to array and sort by tag name
    return Object.values(tagMap).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  });

  // Derived collection with pre-paginated tag pages (10 posts per page)
  eleventyConfig.addCollection("linkTagPages", function (collectionApi) {
    const tags = eleventyConfig.collections?.linkTags
      ? eleventyConfig.collections.linkTags(collectionApi)
      : null;

    // If we can't call the collection, recompute the tag list locally
    const baseTags = tags || (function () {
      const links = collectionApi.getFilteredByGlob("src/links/*.md").filter(i => !i.data.draft);
      const tagMap = {};
      links.forEach(item => {
        const tagArray = Array.isArray(item.data.tags) ? item.data.tags : (item.data.tags ? [item.data.tags] : []);
        tagArray.forEach(t => {
          const name = t.trim();
          const slug = slugify(name);
          if (!tagMap[slug]) tagMap[slug] = { name, slug, posts: [] };
          tagMap[slug].posts.push(item);
        });
      });
      Object.values(tagMap).forEach(t => t.posts.sort((a, b) => b.date - a.date));
      return Object.values(tagMap).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    })();

    const pageSize = 10;
    const pages = [];

    baseTags.forEach(tag => {
      const totalPages = Math.max(1, Math.ceil(tag.posts.length / pageSize));
      for (let pageNumber = 0; pageNumber < totalPages; pageNumber++) {
        const start = pageNumber * pageSize;
        const end = start + pageSize;
        const slice = tag.posts.slice(start, end);
        pages.push({
          name: tag.name,
          slug: tag.slug,
          posts: slice,
          pageNumber,
          totalPages,
          totalPosts: tag.posts.length,
          href: `/links/${tag.slug}/${pageNumber > 0 ? `page/${pageNumber + 1}/` : ''}`,
          previousHref: pageNumber > 0 ? `/links/${tag.slug}/${pageNumber === 1 ? '' : `page/${pageNumber}/`}` : null,
          nextHref: pageNumber < totalPages - 1 ? `/links/${tag.slug}/page/${pageNumber + 2}/` : null
        });
      }
    });

    return pages;
  });

  eleventyConfig.addFilter("date", (dateObj, format = "LLL yyyy") => {
    return DateTime.fromJSDate(dateObj).toFormat(format);
  });

  // Get file's last modified date from filesystem
  eleventyConfig.addFilter("lastModified", (inputPath, format = "MMMM d, yyyy") => {
    try {
      // Handle various input path formats:
      // - ./src/reading.njk (Eleventy's page.inputPath)
      // - src/reading.njk
      // - reading.njk
      let filePath = inputPath;
      if (filePath.startsWith("./")) {
        filePath = filePath.substring(2); // Remove leading ./
      }
      if (!filePath.startsWith("src/")) {
        filePath = path.join("src", filePath);
      }
      const stats = fs.statSync(filePath);
      return DateTime.fromJSDate(stats.mtime).toFormat(format);
    } catch (e) {
      console.warn(`Could not get last modified date for ${inputPath}:`, e.message);
      return "Unknown";
    }
  });

  // Capitalize first letter of a string (used for tag display)
  eleventyConfig.addFilter("capitalize", function (value) {
    if (!value) return value;
    const str = String(value);
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  // Count posts in a collection by year
  eleventyConfig.addFilter("countByYear", function (collection, year) {
    return collection.filter(item => item.date.getFullYear() === parseInt(year)).length;
  });

  // Work out where each photo sits in the three-column grid on /photos/.
  // Portraits step through the columns right → middle → left; landscapes take
  // two columns on whichever side the photo before them left free.
  eleventyConfig.addFilter("photoPlacement", function (photos) {
    if (!photos) return [];

    const PORTRAIT_ORDER = [3, 2, 1]; // right, middle, left
    const other = (side) => (side === "right" ? "left" : "right");

    let portraitStep = 0;
    let lean = null; // which side the previous photo sat on, if either
    let lastLandscape = null; // which side the previous landscape took

    return photos.map(function (photo) {
      const isLandscape = photo.orientation === "landscape";
      let colStart;
      let colSpan;

      if (isLandscape) {
        // Take the two columns the photo before this one left free. A photo in
        // the middle column leaves neither side free, so fall back to bouncing
        // off the previous landscape instead.
        const side = lean ? other(lean) : lastLandscape ? other(lastLandscape) : "right";
        colStart = side === "left" ? 1 : 2;
        colSpan = 2;
        lean = side;
        lastLandscape = side;
      } else {
        colStart = PORTRAIT_ORDER[portraitStep % PORTRAIT_ORDER.length];
        colSpan = 1;
        portraitStep += 1;
        lean = colStart === 2 ? null : colStart === 3 ? "right" : "left";
      }

      return Object.assign({}, photo, { colStart: colStart, colSpan: colSpan, isLandscape: isLandscape });
    });
  });


  // Set up redirects from /writing/* to /journal/* both for local dev and production
  eleventyConfig.setServerOptions({
    domdiff: false,
    port: 8080,
    redirects: {
      "/writing/*": "/journal/:splat",
      "/reading": "/library",
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

