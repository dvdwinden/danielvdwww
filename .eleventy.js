const Image = require("@11ty/eleventy-img");
const path = require("path");
const fs = require("fs");
const { DateTime } = require("luxon");
const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = function (eleventyConfig) {
  // Add regexMatch filter
  eleventyConfig.addFilter("regexMatch", function (str, pattern) {
    const regex = new RegExp(pattern);
    const match = str.match(regex);
    return match ? match : null;
  });

  // Image optimization function
  async function imageShortcode(src, alt, sizes = "(min-width: 1024px) 100vw, 50vw") {
    let metadata = await Image(src, {
      // Generate sizes for both 1x and 2x (retina) displays
      widths: [300, 600, 900, 1200, 1800, 2400],
      formats: ["avif", "webp", "jpeg"],
      outputDir: "./_site/img/",
      urlPath: "/img/",
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
      const imgRegex = /<img\s+[^>]*src=["']([^"']*\/assets\/[^"']*)["'][^>]*>/gi;
      let match;
      while ((match = imgRegex.exec(content)) !== null) {
        const imgTag = match[0];
        const src = match[1];
        const altMatch = imgTag.match(/alt=["']([^"']*)["']/);
        const alt = altMatch ? altMatch[1] : "";

        try {
          const optimizedImg = await imageShortcode(`src/${src}`, alt);
          content = content.replace(imgTag, optimizedImg);
        } catch (err) {
          console.warn(`Failed to optimize image: ${src}`, err.message);
        }
      }
    }
    return content;
  });

  // Retina-optimized image shortcode
  async function retinaImageShortcode(src, alt, maxWidth = 600) {
    let metadata = await Image(src, {
      // Generate 1x and 2x versions for retina
      widths: [maxWidth, maxWidth * 2],
      formats: ["avif", "webp", "jpeg"],
      outputDir: "./_site/img/",
      urlPath: "/img/",
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

  // Copy work directory for videos and images
  eleventyConfig.addPassthroughCopy("src/assets/work");

  // Copy newsletter directory for images
  eleventyConfig.addPassthroughCopy("src/assets/newsletter");

  // Copy now directory for images
  eleventyConfig.addPassthroughCopy("src/assets/now");

  // Copy fonts directory for custom fonts
  eleventyConfig.addPassthroughCopy("src/assets/fonts");

  // Copy favicon.ico to root directory for default browser behavior
  eleventyConfig.addPassthroughCopy({ "src/assets/favicon.ico": "favicon.ico" });

  // Watch CSS files and assets for changes
  eleventyConfig.addWatchTarget("./src/css/");
  eleventyConfig.addWatchTarget("./src/assets/");

  // Ignore _site directory to prevent infinite loops
  eleventyConfig.ignores.add("_site/**");
  eleventyConfig.ignores.add("_site/");

  // Create collection for links
  eleventyConfig.addCollection("links", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/links/*.md").sort((a, b) => b.date - a.date);
  });

  // Create collection for journal
  eleventyConfig.addCollection("journal", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/journal/*.md").sort((a, b) => b.date - a.date);
  });

  // Create collection for newsletter
  eleventyConfig.addCollection("newsletter", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/newsletter/*.md").sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addFilter("date", (dateObj, format = "LLL yyyy") => {
    return DateTime.fromJSDate(dateObj).toFormat(format);
  });

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

