#!/usr/bin/env node

const { BskyAgent } = require('@atproto/api');
const Parser = require('rss-parser');
const fs = require('fs-extra');
const path = require('path');
const { convert } = require('html-to-text');

const BLUESKY_MAX_CHARS = 300;
const SITE_URL = process.env.SITE_URL || 'https://daniel.pizza';

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
    ignoreHref: true,
    ignoreImage: true
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
  const postUrl = post.link;
  const urlLength = postUrl.length + 1; // +1 for space
  
  // Check for custom Bluesky text in the original markdown file
  // This would need to be parsed from frontmatter, but for now we'll use RSS data
  
  if (postType === 'links') {
    // Links posts: "[Title]" - [Brief excerpt] [URL]
    const title = `"${post.title}"`;
    const prefix = `${title} - `;
    const available = maxLength - prefix.length - urlLength - 3; // 3 for "..."
    
    if (available <= 0) {
      // Title + URL is too long, just use title + URL
      return `${title} ${postUrl}`;
    }
    
    const excerpt = extractExcerpt(post.content, available);
    if (excerpt.length === 0) {
      return `${title} ${postUrl}`;
    }
    
    const formatted = `${prefix}${excerpt}`;
    if (formatted.length + urlLength + 3 <= maxLength) {
      return `${formatted}... ${postUrl}`;
    }
    
    return `${title} ${postUrl}`;
    
  } else {
    // Journal posts: New post: "[Title]" [URL] or with description
    const title = `"${post.title}"`;
    const prefix = 'New post: ';
    const titleWithPrefix = `${prefix}${title}`;
    
    const basicLength = titleWithPrefix.length + urlLength + 1;
    if (basicLength <= maxLength) {
      const available = maxLength - basicLength - 3; // 3 for " - "
      
      if (available > 10) {
        const excerpt = extractExcerpt(post.content, available - 3); // 3 for "..."
        if (excerpt.length > 0) {
          return `${titleWithPrefix} - ${excerpt}... ${postUrl}`;
        }
      }
      
      return `${titleWithPrefix} ${postUrl}`;
    } else {
      // Title too long, truncate it
      const availableForTitle = maxLength - prefix.length - urlLength - 4; // 4 for quotes and space
      const truncatedTitle = truncateAtWord(post.title, availableForTitle);
      return `${prefix}"${truncatedTitle}..." ${postUrl}`;
    }
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
          post.link.includes(expectedUrlPattern)
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
 * Post to Bluesky
 */
async function postToBluesky(text) {
  const agent = new BskyAgent({
    service: 'https://bsky.social'
  });
  
  try {
    await agent.login({
      identifier: process.env.BLUESKY_HANDLE,
      password: process.env.BLUESKY_PASSWORD
    });
    
    const result = await agent.post({
      text: text,
      createdAt: new Date().toISOString()
    });
    
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
      
      await postToBluesky(blueskyText);
      
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
