const axios = require('axios');

module.exports = async function() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;
  
  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('⚠️  Strava credentials not found in environment variables');
    return { activityCountByDate: {}, lastUpdated: new Date().toISOString() };
  }

  try {
    console.log('Fetching Strava access token...');
    
    // Get access token
    const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Strava access token fetched');
    
    // Fetch activities from the last year
    console.log('Fetching Strava activities...');
    const oneYearAgo = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);
    
    const activitiesResponse = await axios.get(
      `https://www.strava.com/api/v3/athlete/activities`,
      {
        params: {
          after: oneYearAgo,
          per_page: 200
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const activities = activitiesResponse.data;
    console.log(`✅ Fetched ${activities.length} Strava activities`);
    
    // Process activities into a simpler format for the client
    const activityCountByDate = {};
    activities.forEach(activity => {
      const date = activity.start_date_local.split('T')[0];
      activityCountByDate[date] = (activityCountByDate[date] || 0) + 1;
    });

    return { 
      activityCountByDate,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error fetching Strava activities:', error.message);
    return { 
      activityCountByDate: {},
      lastUpdated: new Date().toISOString()
    };
  }
};
