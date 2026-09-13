// Renders the training calendar on /now from build-time data.
//
// Unlike github-live.js this never calls an API from the browser: the
// intervals.icu key is a build-time secret and must not ship to the client, so
// the grid is drawn purely from window.TRAINING_ACTIVITY and refreshes on the
// next deploy.
class TrainingCalendar {
  constructor(activityByDate) {
    this.activityByDate = activityByDate || {};
    this.init();
  }

  init() {
    this.renderCalendar();
    this.setupResizeHandler();
  }

  // Shaded by time on feet rather than by number of activities: most days hold
  // at most one session, so a count-based scale would render as a near-binary
  // grid. Duration also compares across running, tennis and cycling alike.
  getActivityColor(seconds) {
    const minutes = seconds / 60;
    if (minutes <= 0) return 'bg-black/5 dark:bg-white/10';
    if (minutes < 30) return 'bg-orange-300 dark:bg-orange-900';
    if (minutes < 60) return 'bg-orange-500 dark:bg-orange-700';
    if (minutes < 90) return 'bg-orange-600 dark:bg-orange-600';
    return 'bg-orange-700 dark:bg-orange-500';
  }

  describe(day) {
    if (!day || !day.count) return 'No training';

    const parts = [];
    const minutes = Math.round((day.seconds || 0) / 60);

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const rest = minutes % 60;
      parts.push(rest ? `${hours}h ${rest}m` : `${hours}h`);
    } else if (minutes > 0) {
      parts.push(`${minutes} min`);
    }

    if (day.metres >= 1000) {
      parts.push(`${(day.metres / 1000).toFixed(1)} km`);
    }

    if (!parts.length) {
      return `${day.count} ${day.count === 1 ? 'activity' : 'activities'}`;
    }

    return parts.join(' · ');
  }

  renderCalendar() {
    const container = document.getElementById('training-calendar');

    if (!container) {
      console.warn('Training: Container element not found!');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fit as many weeks as the column allows, capped at a year.
    const containerWidth = container.offsetWidth || container.clientWidth || 512;
    const weekWidth = 14; // 11px for week + 3px gap
    const weeksToShow = Math.min(Math.floor(containerWidth / weekWidth), 52);
    const daysToShow = weeksToShow * 7;

    const days = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      // Built from local parts, not toISOString(), which would shift the date
      // back a day for anyone east of UTC — Amsterdam included.
      const dateStr = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ].join('-');
      days.push({ date: dateStr, activity: this.activityByDate[dateStr] || null, dateObj: date });
    }

    const weeks = [];
    let currentWeek = [];

    days.forEach((day, index) => {
      const dayOfWeek = day.dateObj.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Weeks start Monday

      if (index === 0 && adjustedDay > 0) {
        for (let i = 0; i < adjustedDay; i++) currentWeek.push(null);
      }

      currentWeek.push(day);

      if (adjustedDay === 6) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      } else if (index === days.length - 1) {
        while (currentWeek.length < 7) currentWeek.push(null);
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    if (weeks.length > weeksToShow) {
      weeks.splice(0, weeks.length - weeksToShow);
    }

    container.innerHTML = `
      <div class="training-calendar w-full relative">
        <div id="training-tooltip" class="absolute hidden bg-gray-900 dark:bg-gray-700 text-white text-xs font-sans px-2 py-1 rounded shadow-lg pointer-events-none z-50 whitespace-nowrap"></div>
        <div class="flex gap-1 overflow-hidden">
          ${weeks.map(week => `
            <div class="flex flex-col gap-1 flex-shrink-0">
              ${week.map(day => {
                if (!day) return '<div class="w-2.5 h-2.5"></div>';
                const seconds = day.activity ? day.activity.seconds : 0;
                const color = this.getActivityColor(seconds);
                const text = this.describe(day.activity);
                return `<div class="w-2.5 h-2.5 rounded-sm ${color} border border-black/5 dark:border-white/10 transition-colors cursor-pointer" data-date="${day.date}" data-text="${text}"></div>`;
              }).join('')}
            </div>
          `).join('')}
        </div>
        <figcaption class="mt-2">My recent training, by time on feet</figcaption>
      </div>
    `;

    container.style.display = 'block';
    this.setupTooltip('training-tooltip');
  }

  setupTooltip(tooltipId) {
    const tooltip = document.getElementById(tooltipId);
    if (!tooltip) return;

    document.querySelectorAll('.training-calendar [data-date]').forEach(square => {
      square.addEventListener('mouseenter', () => {
        const formattedDate = this.formatDate(square.getAttribute('data-date'));
        tooltip.textContent = `${square.getAttribute('data-text')} on ${formattedDate}`;
        tooltip.classList.remove('hidden');

        const rect = square.getBoundingClientRect();
        const containerRect = square.closest('.training-calendar').getBoundingClientRect();

        tooltip.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - containerRect.top}px`;
        tooltip.style.transform = 'translate(-50%, calc(-100% - 8px))';
      });

      square.addEventListener('mouseleave', () => {
        tooltip.classList.add('hidden');
      });
    });
  }

  setupResizeHandler() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.renderCalendar(), 250);
    });
  }

  formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const day = date.getDate();
    return `${months[date.getMonth()]} ${day}${this.getOrdinalSuffix(day)}`;
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
  // Nothing to draw on pages without the container, or before the first
  // successful fetch has populated it.
  if (!document.getElementById('training-calendar')) return;

  window.trainingCalendar = new TrainingCalendar(window.TRAINING_ACTIVITY || {});
});
