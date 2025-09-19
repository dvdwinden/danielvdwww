class LastFMLive {
  constructor(apiKey, username) {
    this.apiKey = apiKey;
    this.username = username;
    this.updateInterval = 30000; // 30 seconds
    this.retryInterval = 60000; // 1 minute on error
    this.intervalId = null;

    this.init();
  }

  init() {
    this.updateNowPlaying();
    this.startPolling();
  }

  fetchNowPlaying() {
    return new Promise((resolve, reject) => {
      // Generate a unique callback name
      const callbackName = 'lastfm_callback_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

      // Create script element for JSONP
      const script = document.createElement('script');
      const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${this.username}&api_key=${this.apiKey}&format=json&limit=1&callback=${callbackName}`;

      // Set up the callback function
      window[callbackName] = (data) => {
        try {
          const tracks = data?.recenttracks?.track;
          if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
            resolve(null);
            return;
          }

          const track = tracks[0];
          const isNowPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';

          if (!isNowPlaying) {
            resolve(null);
            return;
          }

          resolve({
            artist: track.artist['#text'] || track.artist,
            title: track.name,
            album: track.album['#text'] || track.album,
            url: track.url
          });
        } catch (error) {
          console.warn('Failed to parse Last.fm data:', error);
          resolve(null);
        } finally {
          // Clean up
          document.head.removeChild(script);
          delete window[callbackName];
        }
      };

      // Handle errors
      script.onerror = () => {
        console.warn('Failed to load Last.fm data');
        document.head.removeChild(script);
        delete window[callbackName];
        resolve(null);
      };

      // Set source and add to head
      script.src = url;
      document.head.appendChild(script);
    });
  }

  async updateNowPlaying() {
    console.log('LastFM: updateNowPlaying called');
    const nowPlaying = await this.fetchNowPlaying();
    console.log('LastFM: nowPlaying result:', nowPlaying);
    const container = document.getElementById('lastfm-now-playing');
    console.log('LastFM: container found:', container);

    if (!container) {
      console.warn('LastFM: Container element not found!');
      return;
    }

    if (nowPlaying) {
      console.log('LastFM: Updating container with now playing');
      container.innerHTML = `
        <div class="lastfm ">
          Now playing: <a href="${nowPlaying.url}" target="_blank" rel="noopener" class="text-black/65 dark:text-white/80 hover:text-gray-900 dark:hover:text-gray-100">${nowPlaying.artist} — ${nowPlaying.title}</a>
        </div>
      `;
      container.style.display = 'block';
      console.log('LastFM: Container updated successfully');
    } else {
      console.log('LastFM: No now playing, hiding container');
      container.style.display = 'none';
    }
  }

  startPolling() {
    this.intervalId = setInterval(() => {
      this.updateNowPlaying();
    }, this.updateInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  console.log('LastFM: DOM loaded, initializing...');
  // Only initialize if we have the API key and username
  // These would need to be set as global variables or data attributes
  const apiKey = 'd5f74219006f0df5fe3f403ffb7fdc28';
  const username = 'dvdwinden';

  console.log('LastFM: API key and username:', apiKey ? 'present' : 'missing', username);

  if (apiKey && username) {
    console.log('LastFM: Creating LastFMLive instance');
    window.lastfmLive = new LastFMLive(apiKey, username);
  } else {
    console.warn('LastFM: Missing API key or username');
  }
});
