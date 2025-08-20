#!/usr/bin/env node

const { BskyAgent } = require('@atproto/api');
const Parser = require('rss-parser');
const fs = require('fs-extra');
const path = require('path');
const { convert } = require('html-to-text');
const https = require('https');
const http = require('http');

const BLUESKY_MAX_CHARS = 300;
const SITE_URL = process.env.SITE_URL || 'https://www.daniel.pizza';

// Initialize RSS parser
const parser = new Parser({
  customFields: {
    item: ['external_url']
  }
});

/**
 * Truncate text at word boundary
 */
function truncateAtWord(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace);
  }
  
  return truncated;
}

/**
 * Extract plain text excerpt from HTML content
 */
function extractExcerpt(htmlContent, maxLength = 200) {
  if (!htmlContent) return '';
  
  const text = convert(htmlContent, {
    wordwrap: false,
    preserveNewlines: false,
    selectors: [
      { selector: 'a', options: { ignoreHref: true, hideLinkHrefIfSameAsText: true } },
      { selector: 'p', options: { leadingLineBreaks: 0, trailingLineBreaks: 1 } },
      { selector: 'img', options: { ignoreHref: true, ignoreImage: true } }
    ]
  });
  
  // Get first paragraph or sentence
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  const firstParagraph = paragraphs[0] || '';
  
  return truncateAtWord(firstParagraph.trim(), maxLength);
}

/**
 * Format post content for Bluesky with character limit
 */
function formatForBluesky(post, postType) {
  const maxLength = BLUESKY_MAX_CHARS;
  const postUrl = post.id; // Use internal URL instead of external link
  const urlLength = postUrl.length + 1; // +1 for space
  
  // Get the full excerpt first
  const fullExcerpt = extractExcerpt(post.content, 1000); // Get a long excerpt initially
  
  if (!fullExcerpt) {
    // No excerpt available, just use URL
    return postUrl;
  }
  
  // Check if full excerpt + URL fits within character limit
  const fullFormat = `${fullExcerpt} ${postUrl}`;
  
  if (fullFormat.length <= maxLength) {
    // Full excerpt fits, use it as-is
    return fullFormat;
  }
  
  // Need to truncate - calculate available space for excerpt
  const availableForExcerpt = maxLength - urlLength - 3; // 3 for "..."
  
  if (availableForExcerpt <= 10) {
    // Not enough space for meaningful excerpt, just use URL
    return postUrl;
  }
  
  // Truncate excerpt and add ellipsis
  const truncatedExcerpt = truncateAtWord(fullExcerpt, availableForExcerpt);
  return `${truncatedExcerpt}... ${postUrl}`;
}

/**
 * Download image from URL
 */
async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = response.headers['content-type'];
        resolve({ buffer, contentType });
      });
    }).on('error', reject);
  });
}

/**
 * Extract first image URL from post content
 */
function extractFirstImageUrl(htmlContent) {
  if (!htmlContent) return null;
  
  // Look for img tags in the content
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
  const match = htmlContent.match(imgRegex);
  
  if (match && match[1]) {
    let imageUrl = match[1];
    
    // Convert relative URLs to absolute
    if (imageUrl.startsWith('/')) {
      imageUrl = `${SITE_URL}${imageUrl}`;
    } else if (imageUrl.startsWith('assets/')) {
      imageUrl = `${SITE_URL}/${imageUrl}`;
    }
    
    return imageUrl;
  }
  
  return null;
}

/**
 * Upload image to Bluesky
 */
async function uploadImageToBluesky(agent, imageUrl) {
  try {
    console.log(`📸 Downloading image: ${imageUrl}`);
    const { buffer, contentType } = await downloadImage(imageUrl);
    
    // Check file size (Bluesky has limits)
    const maxSize = 1000000; // 1MB limit
    if (buffer.length > maxSize) {
      console.log(`⚠️ Image too large (${buffer.length} bytes), skipping`);
      return null;
    }
    
    console.log(`📤 Uploading image to Bluesky (${buffer.length} bytes, ${contentType})`);
    const response = await agent.uploadBlob(buffer, { encoding: contentType });
    
    return {
      image: {
        alt: '', // We could extract alt text from the img tag if needed
        image: response.data.blob
      }
    };
    
  } catch (error) {
    console.error(`❌ Failed to upload image: ${error.message}`);
    return null;
  }
}

/**
 * Parse RSS feed and find posts matching changed files
 */
async function findPostsFromChangedFiles(changedFiles) {
  const posts = [];
  
  try {
    // Parse RSS feeds
    const globalFeed = await parser.parseURL(`${SITE_URL}/feed.xml`);
    const linksFeed = await parser.parseURL(`${SITE_URL}/links/feed.xml`);
    const journalFeed = await parser.parseURL(`${SITE_URL}/journal/feed.xml`);
    
    // Combine all posts with their type
    const allPosts = [
      ...linksFeed.items.map(item => ({ ...item, type: 'links' })),
      ...journalFeed.items.map(item => ({ ...item, type: 'journal' }))
    ];
    
    // Match changed files to RSS entries
    for (const filePath of changedFiles) {
      const fileName = path.basename(filePath, '.md');
      const isLinks = filePath.startsWith('src/links/');
      const isJournal = filePath.startsWith('src/journal/');
      
      if (isLinks || isJournal) {
        // Find matching post in RSS feeds by URL pattern
        const expectedUrlPattern = isLinks ? `/links/${fileName}/` : `/journal/${fileName}/`;
        const matchingPost = allPosts.find(post => 
          post.id && post.id.includes(expectedUrlPattern)
        );
        
        if (matchingPost) {
          posts.push(matchingPost);
          console.log(`Found matching post: ${matchingPost.title}`);
        } else {
          console.log(`No RSS entry found for: ${filePath}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error parsing RSS feeds:', error.message);
    // Fallback: check if RSS feeds exist
    console.log('Make sure the site has been built and RSS feeds are available');
  }
  
  return posts;
}

/**
 * Post to Bluesky with optional image
 */
async function postToBluesky(text, post = null) {
  const agent = new BskyAgent({
    service: 'https://bsky.social'
  });
  
  try {
    await agent.login({
      identifier: process.env.BLUESKY_HANDLE,
      password: process.env.BLUESKY_PASSWORD
    });
    
    // Prepare post data
    const postData = {
      text: text,
      createdAt: new Date().toISOString()
    };
    
    // Try to add image if post content contains one
    if (post && post.content) {
      const imageUrl = extractFirstImageUrl(post.content);
      if (imageUrl) {
        const embed = await uploadImageToBluesky(agent, imageUrl);
        if (embed) {
          postData.embed = embed;
          console.log(`📷 Image attached to post`);
        }
      }
    }
    
    const result = await agent.post(postData);
    
    console.log(`✅ Posted to Bluesky: ${text}`);
    console.log(`🔗 Post URL: https://bsky.app/profile/${process.env.BLUESKY_HANDLE}/post/${result.uri.split('/').pop()}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error posting to Bluesky:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const changedFilesArg = process.argv[2];
  
  if (!changedFilesArg) {
    console.log('No changed files provided');
    return;
  }
  
  const changedFiles = changedFilesArg.split('\n').filter(f => f.trim());
  
  if (changedFiles.length === 0) {
    console.log('No relevant changed files found');
    return;
  }
  
  console.log('Changed files:', changedFiles);
  
  // Check required environment variables
  if (!process.env.BLUESKY_HANDLE || !process.env.BLUESKY_PASSWORD) {
    console.error('❌ Missing required environment variables: BLUESKY_HANDLE and BLUESKY_PASSWORD');
    process.exit(1);
  }
  
  try {
    // Find posts from changed files
    const posts = await findPostsFromChangedFiles(changedFiles);
    
    if (posts.length === 0) {
      console.log('No posts found to syndicate');
      return;
    }
    
    // Post each one to Bluesky
    for (const post of posts) {
      const blueskyText = formatForBluesky(post, post.type);
      
      console.log(`📝 Posting: ${blueskyText}`);
      console.log(`📏 Length: ${blueskyText.length}/${BLUESKY_MAX_CHARS}`);
      
      if (blueskyText.length > BLUESKY_MAX_CHARS) {
        console.error(`❌ Post too long: ${blueskyText.length} characters`);
        continue;
      }
      
      await postToBluesky(blueskyText, post);
      
      // Add delay between posts to be respectful
      if (posts.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
  } catch (error) {
    console.error('❌ Syndication failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
