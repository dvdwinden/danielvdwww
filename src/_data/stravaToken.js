const axios = require('axios');

module.exports = async function() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;
  
  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('⚠️  Strava credentials not found in environment variables');
    return { accessToken: null };
  }

  try {
    console.log('Fetching Strava access token...');
    
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    console.log('✅ Strava access token fetched');
    return { 
      accessToken: response.data.access_token,
      expiresAt: response.data.expires_at
    };

  } catch (error) {
    console.error('❌ Error fetching Strava access token:', error.message);
    return { accessToken: null };
  }
};
