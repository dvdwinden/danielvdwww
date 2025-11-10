class GitHubLive {
  constructor(username, cachedContributions, lastUpdated) {
    this.username = username;
    this.updateInterval = 300000; // 5 minutes
    this.intervalId = null;
    this.contributionsByDate = cachedContributions || {};
    this.lastUpdated = lastUpdated ? new Date(lastUpdated) : null;

    this.init();
  }

  async init() {
    // Render immediately with cached data
    this.renderCalendar();
    
    // Check if we need to fetch new data
    if (this.shouldFetchNewData()) {
      await this.updateContributions();
      this.renderCalendar();
    }
    
    this.startPolling();
    this.setupResizeHandler();
  }

  shouldFetchNewData() {
    if (!this.lastUpdated) return true;
    
    const now = new Date();
    const currentHour = now.getHours();
    const timeSinceUpdate = now - this.lastUpdated;
    const hoursSinceUpdate = timeSinceUpdate / (1000 * 60 * 60);
    
    // Only fetch if it's after 21:00 and we haven't fetched today yet
    if (currentHour >= 21 && hoursSinceUpdate >= 1) {
      const lastUpdateDate = this.lastUpdated.toDateString();
      const currentDate = now.toDateString();
      return lastUpdateDate !== currentDate;
    }
    
    return false;
  }

  async fetchContributions() {
    if (!this.username) {
      console.warn('GitHub: No username available');
      return {};
    }

    try {
      // Fetch the SVG chart from ghchart.rshah.org
      const response = await fetch(`https://ghchart.rshah.org/${this.username}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch contributions: ${response.status}`);
      }

      const svgText = await response.text();
      
      // Parse the SVG to extract contribution data
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      const rects = doc.querySelectorAll('rect');
      
      const contributions = {};
      rects.forEach(rect => {
        const date = rect.getAttribute('data-date');
        const score = rect.getAttribute('data-score');
        const count = parseInt(score || '0', 10);
        if (date) {
          contributions[date] = count;
        }
      });
      
      console.log(`GitHub: Parsed ${Object.keys(contributions).length} contribution dates`);
      return contributions;
    } catch (error) {
      console.error('GitHub: Failed to fetch contributions:', error);
      return {};
    }
  }

  async updateContributions() {
    const contributions = await this.fetchContributions();
    
    if (Object.keys(contributions).length > 0) {
      this.contributionsByDate = contributions;
      this.lastUpdated = new Date();
    }
  }

  getContributionColor(count) {
    // GitHub-style green color scheme using emerald (darker tones)
    if (count === 0) return 'bg-black/5 dark:bg-white/10';
    if (count === 1) return 'bg-emerald-300 dark:bg-emerald-900';
    if (count === 2) return 'bg-emerald-500 dark:bg-emerald-700';
    if (count === 3) return 'bg-emerald-600 dark:bg-emerald-600';
    return 'bg-emerald-700 dark:bg-emerald-500';
  }

  renderCalendar() {
    const container = document.getElementById('github-calendar');
    
    if (!container) {
      console.warn('GitHub: Container element not found!');
      return;
    }

    const contributionsByDate = this.contributionsByDate;
    
    // Get today's date at midnight in local timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate how many weeks we can fit based on container width
    const containerWidth = container.offsetWidth || container.clientWidth || 512;
    const weekWidth = 14; // 11px for week + 3px gap
    const maxWeeks = Math.floor(containerWidth / weekWidth);
    const weeksToShow = Math.min(maxWeeks, 52); // Cap at 1 year maximum
    const daysToShow = weeksToShow * 7;

    // Generate days going back from today
    const days = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = contributionsByDate[dateStr] || 0;
      days.push({ date: dateStr, count, dateObj: date });
    }

    const weeks = [];
    let currentWeek = [];

    days.forEach((day, index) => {
      const dayOfWeek = day.dateObj.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      if (index === 0 && adjustedDay > 0) {
        for (let i = 0; i < adjustedDay; i++) {
          currentWeek.push(null);
        }
      }

      currentWeek.push(day);

      if (adjustedDay === 6) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      } else if (index === days.length - 1) {
        // Fill the rest of the week with empty cells
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    // Trim weeks from the left if we have more than we can show
    if (weeks.length > weeksToShow) {
      weeks.splice(0, weeks.length - weeksToShow);
    }

    const calendarHTML = `
      <div class="github-calendar w-full overflow-hidden">
        <div class="flex gap-1 pb-2">
          ${weeks.map(week => `
            <div class="flex flex-col gap-1 flex-shrink-0">
              ${week.map(day => {
      if (!day) {
        return '<div class="w-2.5 h-2.5"></div>';
      }
      const color = this.getContributionColor(day.count);
      const title = day.count > 0
        ? `${day.date}: ${day.count} ${day.count === 1 ? 'contribution' : 'contributions'}`
        : `${day.date}: No contributions`;
      return `<div class="w-2.5 h-2.5 rounded-sm ${color} border border-black/5 dark:border-white/10 transition-colors" title="${title}"></div>`;
    }).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = calendarHTML;
    container.style.display = 'block';
    console.log('GitHub: Calendar rendered');
  }

  startPolling() {
    this.intervalId = setInterval(async () => {
      // Only fetch if we should (after 21:00 once per day)
      if (this.shouldFetchNewData()) {
        console.log('GitHub: Time to refresh data');
        await this.updateContributions();
        this.renderCalendar();
      }
    }, this.updateInterval);
  }

  setupResizeHandler() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.renderCalendar();
      }, 250); // Debounce resize events
    });
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  console.log('GitHub: DOM loaded, initializing...');

  const username = window.GITHUB_USERNAME || 'dvdwinden';
  const cachedContributions = window.GITHUB_CONTRIBUTIONS || {};
  const lastUpdated = window.GITHUB_LAST_UPDATED || null;

  console.log('GitHub: Username:', username);
  console.log('GitHub: Cached contributions:', Object.keys(cachedContributions).length, 'dates');
  console.log('GitHub: Last updated:', lastUpdated);

  window.githubLive = new GitHubLive(username, cachedContributions, lastUpdated);
});
