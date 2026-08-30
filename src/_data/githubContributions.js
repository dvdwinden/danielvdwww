const axios = require('axios');

// `--serve`/`--watch` is local dev: a dead token shouldn't take the whole
// site down over a decorative graph. Real builds still hard-fail.
const isDevServer = process.argv.includes('--serve') || process.argv.includes('--watch');

module.exports = async function() {
  const username = 'dvdwinden';
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    if (process.env.CI) {
      throw new Error('GITHUB_TOKEN is not set — check the GH_PAT secret in GitHub Actions.');
    }
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
      const gqlError = new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
      gqlError.isGraphQLError = true;
      throw gqlError;
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
    const status = error.response?.status;

    // Auth/config problems are silent killers — an expired token would otherwise
    // ship an empty contribution graph. Fail the build instead.
    if (status === 401 || status === 403 || error.isGraphQLError) {
      const message =
        `❌ GitHub API auth failed (${status || 'GraphQL error'}): ${error.message}\n` +
        `   Regenerate GITHUB_TOKEN (scope: read:user) and update the GH_PAT secret.`;

      if (!isDevServer) {
        throw new Error(message);
      }

      console.error(message);
      console.error('   Dev server: continuing with an empty contribution graph.');
      console.error('   Already updated .env? Restart `npm run dev` — dotenv only reads it at startup.');
      return {
        contributionsByDate: {},
        lastUpdated: new Date().toISOString()
      };
    }

    // Transient network trouble shouldn't block a deploy.
    console.error('❌ Error fetching GitHub contributions:', error.message);
    return {
      contributionsByDate: {},
      lastUpdated: new Date().toISOString()
    };
  }
};
