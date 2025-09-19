const axios = require('axios');

module.exports = async function() {
  const apiKey = process.env.LASTFM_API_KEY;
  const username = process.env.LASTFM_USERNAME;

  if (!apiKey || !username) {
    console.log('Last.fm API key or username not found in environment variables');
    return {
      nowPlaying: null,
      recentTrack: null
    };
  }

  try {
    const response = await axios.get('https://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'user.getrecenttracks',
        user: username,
        api_key: apiKey,
        format: 'json',
        limit: 1
      },
      timeout: 5000
    });

    const tracks = response.data?.recenttracks?.track;
    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return {
        nowPlaying: null,
        recentTrack: null
      };
    }

    const track = tracks[0];
    const isNowPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';
    
    const trackInfo = {
      artist: track.artist['#text'] || track.artist,
      title: track.name,
      album: track.album['#text'] || track.album,
      url: track.url,
      timestamp: track.date ? track.date.uts : null
    };

    return {
      nowPlaying: isNowPlaying ? trackInfo : null,
      recentTrack: trackInfo
    };

  } catch (error) {
    console.warn('Failed to fetch Last.fm data:', error.message);
    return {
      nowPlaying: null,
      recentTrack: null
    };
  }
};