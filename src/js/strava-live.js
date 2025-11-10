class StravaLive {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.updateInterval = 300000; // 5 minutes
    this.intervalId = null;
    this.activities = [];

    this.init();
  }

  async init() {
    if (!this.accessToken) {
      console.warn('Strava: No access token available');
      return;
    }
    await this.updateActivities();
    this.renderCalendar();
    this.startPolling();
  }

  async fetchActivities() {
    if (!this.accessToken) {
      console.warn('Strava: No access token available');
      return [];
    }

    try {
      const ninetyDaysAgo = Math.floor(Date.now() / 1000) - (90 * 24 * 60 * 60);
      
      const response = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?after=${ninetyDaysAgo}&per_page=200`,
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
    this.activities = await this.fetchActivities();
  }

  getActivityCountByDate() {
    const countByDate = {};
    
    this.activities.forEach(activity => {
      const date = activity.start_date_local.split('T')[0];
      countByDate[date] = (countByDate[date] || 0) + 1;
    });

    return countByDate;
  }

  getActivityColor(count) {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
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

    const activityCountByDate = this.getActivityCountByDate();
    const today = new Date();
    const daysToShow = 90;

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
      
      if (adjustedDay === 6 || index === days.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    const calendarHTML = `
      <div class="strava-calendar">
        <div class="flex gap-1 overflow-x-auto pb-2">
          ${weeks.map(week => `
            <div class="flex flex-col gap-1">
              ${week.map(day => {
                if (!day) {
                  return '<div class="w-3 h-3"></div>';
                }
                const color = this.getActivityColor(day.count);
                const title = day.count > 0 
                  ? `${day.date}: ${day.count} ${day.count === 1 ? 'activity' : 'activities'}`
                  : `${day.date}: No activities`;
                return `<div class="w-3 h-3 rounded-sm ${color} transition-colors" title="${title}"></div>`;
              }).join('')}
            </div>
          `).join('')}
        </div>
        <div class="mt-2 flex items-center gap-2 text-xs text-black/50 dark:text-white/50">
          <span>Less</span>
          <div class="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800"></div>
          <div class="w-3 h-3 rounded-sm bg-orange-200 dark:bg-orange-900"></div>
          <div class="w-3 h-3 rounded-sm bg-orange-400 dark:bg-orange-700"></div>
          <div class="w-3 h-3 rounded-sm bg-orange-600 dark:bg-orange-500"></div>
          <span>More</span>
        </div>
      </div>
    `;

    container.innerHTML = calendarHTML;
    container.style.display = 'block';
    console.log('Strava: Calendar rendered');
  }

  startPolling() {
    this.intervalId = setInterval(async () => {
      await this.updateActivities();
      this.renderCalendar();
    }, this.updateInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  console.log('Strava: DOM loaded, initializing...');
  
  const accessToken = window.STRAVA_ACCESS_TOKEN || null;

  console.log('Strava: Access token present:', !!accessToken);

  if (accessToken) {
    console.log('Strava: Creating StravaLive instance');
    window.stravaLive = new StravaLive(accessToken);
  } else {
    console.warn('Strava: Missing access token');
  }
});
