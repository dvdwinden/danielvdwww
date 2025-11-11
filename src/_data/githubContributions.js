const axios = require('axios');

module.exports = async function() {
  const username = 'dvdwinden';
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.warn('⚠️  GitHub token not found in environment variables');
    return { contributionsByDate: {}, lastUpdated: new Date().toISOString() };
  }
  
  try {
    console.log('Fetching GitHub contributions via GraphQL API...');
    
    // Calculate date range (last year)
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setFullYear(fromDate.getFullYear() - 1);
    
    const query = `
      query($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }
    `;
    
    const response = await axios.post(
      'https://api.github.com/graphql',
      {
        query,
        variables: {
          username,
          from: fromDate.toISOString(),
          to: toDate.toISOString()
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
    }
    
    const contributionsByDate = {};
    const weeks = response.data.data.user.contributionsCollection.contributionCalendar.weeks;
    
    weeks.forEach(week => {
      week.contributionDays.forEach(day => {
        contributionsByDate[day.date] = day.contributionCount;
      });
    });
    
    console.log(`✅ Fetched ${Object.keys(contributionsByDate).length} contribution dates from GitHub API`);
    
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
