class StravaLive {
  constructor(accessToken, cachedActivities, lastUpdated) {
    this.accessToken = accessToken;
    this.updateInterval = 300000; // 5 minutes
    this.intervalId = null;
    this.activityCountByDate = cachedActivities || {};
    this.lastUpdated = lastUpdated ? new Date(lastUpdated) : null;

    this.init();
  }

  async init() {
    // Render immediately with cached data
    this.renderCalendar();

    // Check if we need to fetch new data
    if (this.shouldFetchNewData()) {
      await this.updateActivities();
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

  async fetchActivities() {
    if (!this.accessToken) {
      console.warn('Strava: No access token available');
      return [];
    }

    try {
      // Fetch activities from the last year to have enough data
      const oneYearAgo = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);

      const response = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?after=${oneYearAgo}&per_page=200`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }

      const activities = await response.json();
      console.log(`Strava: Fetched ${activities.length} activities`);
      return activities;
    } catch (error) {
      console.error('Strava: Failed to fetch activities:', error);
      return [];
    }
  }

  async updateActivities() {
    const activities = await this.fetchActivities();

    // Process activities into count by date
    const activityCountByDate = {};
    activities.forEach(activity => {
      const date = activity.start_date_local.split('T')[0];
      activityCountByDate[date] = (activityCountByDate[date] || 0) + 1;
    });

    this.activityCountByDate = activityCountByDate;
    this.lastUpdated = new Date();
  }


  getActivityColor(count) {
    if (count === 0) return 'bg-black/5 dark:bg-white/10';
    if (count === 1) return 'bg-orange-200 dark:bg-orange-900';
    if (count === 2) return 'bg-orange-400 dark:bg-orange-700';
    return 'bg-orange-600 dark:bg-orange-500';
  }

  showRateLimitMessage() {
    const container = document.getElementById('strava-calendar');
    if (container) {
      container.innerHTML = `
        <div class="text-sm text-black/50 dark:text-white/50">
          Strava rate limit reached. Calendar will update automatically when available.
        </div>
      `;
      container.style.display = 'block';
    }
  }

  renderCalendar() {
    const container = document.getElementById('strava-calendar');

    if (!container) {
      console.warn('Strava: Container element not found!');
      return;
    }

    const activityCountByDate = this.activityCountByDate;
    // Get today's date at midnight in local timezone to ensure consistency
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate how many weeks we can fit based on container width
    // Each week is approximately 14px (11px width + 3px gap)
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
      const count = activityCountByDate[dateStr] || 0;
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
      <div class="strava-calendar w-full relative">
        <div id="strava-tooltip" class="absolute hidden bg-gray-900 dark:bg-gray-700 text-white text-xs font-sans px-2 py-1 rounded shadow-lg pointer-events-none z-50 whitespace-nowrap"></div>
        <div class="flex gap-1 overflow-hidden">
          ${weeks.map(week => `
            <div class="flex flex-col gap-1 flex-shrink-0">
              ${week.map(day => {
      if (!day) {
        return '<div class="w-2.5 h-2.5"></div>';
      }
      const color = this.getActivityColor(day.count);
      const text = day.count > 0
        ? `${day.count} ${day.count === 1 ? 'Strava activity' : 'Strava activities'}`
        : 'No activities';
      return `<div class="w-2.5 h-2.5 rounded-sm ${color} border border-black/5 dark:border-white/10 transition-colors cursor-pointer" data-date="${day.date}" data-count="${day.count}" data-text="${text}"></div>`;
    }).join('')}
            </div>
          `).join('')}
        </div>
        <figcaption class="mt-2">My Strava activities over the last year</figcaption>
      </div>
    `;

    container.innerHTML = calendarHTML;
    container.style.display = 'block';

    // Add tooltip event listeners
    this.setupTooltip('strava-tooltip');

    console.log('Strava: Calendar rendered');
  }

  setupTooltip(tooltipId) {
    const tooltip = document.getElementById(tooltipId);
    if (!tooltip) return;

    const squares = document.querySelectorAll('.strava-calendar [data-date]');

    squares.forEach(square => {
      square.addEventListener('mouseenter', (e) => {
        const text = square.getAttribute('data-text');
        const date = square.getAttribute('data-date');
        const formattedDate = this.formatDate(date);
        tooltip.textContent = `${text} on ${formattedDate}`;
        tooltip.classList.remove('hidden');

        // Position tooltip above the square
        const rect = square.getBoundingClientRect();
        const container = square.closest('.strava-calendar');
        const containerRect = container.getBoundingClientRect();

        // Position relative to container
        const left = rect.left - containerRect.left + rect.width / 2;
        const top = rect.top - containerRect.top;

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.style.transform = 'translate(-50%, calc(-100% - 8px))';
      });

      square.addEventListener('mouseleave', () => {
        tooltip.classList.add('hidden');
      });
    });
  }

  startPolling() {
    this.intervalId = setInterval(async () => {
      // Only fetch if we should (after 21:00 once per day)
      if (this.shouldFetchNewData()) {
        console.log('Strava: Time to refresh data');
        await this.updateActivities();
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

  formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const day = date.getDate();
    const suffix = this.getOrdinalSuffix(day);
    return `${months[date.getMonth()]} ${day}${suffix}`;
  }

  getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  console.log('Strava: DOM loaded, initializing...');

  const accessToken = window.STRAVA_ACCESS_TOKEN || null;
  const cachedActivities = window.STRAVA_ACTIVITIES || {};
  const lastUpdated = window.STRAVA_LAST_UPDATED || null;

  console.log('Strava: Access token present:', !!accessToken);
  console.log('Strava: Cached activities:', Object.keys(cachedActivities).length, 'dates');
  console.log('Strava: Last updated:', lastUpdated);

  window.stravaLive = new StravaLive(accessToken, cachedActivities, lastUpdated);
});
