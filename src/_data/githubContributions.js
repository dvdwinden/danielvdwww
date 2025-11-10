const axios = require('axios');

module.exports = async function() {
  const username = 'dvdwinden';
  
  try {
    console.log('Fetching GitHub contributions chart...');
    
    // Fetch the SVG chart from ghchart.rshah.org
    const response = await axios.get(`https://ghchart.rshah.org/${username}`);
    
    if (!response.data) {
      throw new Error('No data received from ghchart.rshah.org');
    }
    
    console.log('✅ GitHub contributions chart fetched');
    
    // Parse the SVG to extract contribution data
    const svgText = response.data;
    const contributionsByDate = {};
    
    // Extract data-date and data-score attributes from rect elements
    const rectRegex = /<rect[^>]*data-score="([^"]*)"[^>]*data-date="([^"]*)"[^>]*>/g;
    let match;
    
    while ((match = rectRegex.exec(svgText)) !== null) {
      const score = match[1];
      const date = match[2];
      const count = parseInt(score || '0', 10);
      if (date) {
        contributionsByDate[date] = count;
      }
    }
    
    console.log(`✅ Parsed ${Object.keys(contributionsByDate).length} contribution dates`);
    
    return { 
      contributionsByDate,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error fetching GitHub contributions:', error.message);
    return { 
      contributionsByDate: {},
      lastUpdated: new Date().toISOString()
    };
  }
};
