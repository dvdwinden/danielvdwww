// A GitHub-style calendar of training days, from intervals.icu (which syncs
// from my COROS watch). The days are aggregated at build time — see
// _data/trainingActivities.js — so this file only ever draws what is already
// on the page. No API call, no credential in the browser.
//
// Shaded by time on feet rather than session count: most days hold at most one
// session, so a count-based scale would render near-binary. Duration also
// compares sensibly across running, tennis and cycling.

class TrainingLive {
  constructor(activityByDate) {
    this.activityByDate = activityByDate || {};
    this.container = document.getElementById('training-calendar');

    if (!this.container || !Object.keys(this.activityByDate).length) return;

    this.render();
    this.setupResizeHandler();
  }

  // Orange rather than the red the palette's `hover` would give: it sits
  // beside the emerald GitHub grid, and red/green side by side is the one
  // pairing that collapses for the most common kind of colour blindness.
  getColor(seconds) {
    if (!seconds) return 'bg-black/5 dark:bg-white/10';
    const minutes = seconds / 60;
    if (minutes < 30) return 'bg-orange-200 dark:bg-orange-900';
    if (minutes < 60) return 'bg-orange-400 dark:bg-orange-700';
    if (minutes < 90) return 'bg-orange-500 dark:bg-orange-600';
    return 'bg-orange-600 dark:bg-orange-400';
  }

  // Striped when tennis took most of the day's time, solid otherwise — so a
  // warm-up jog before a match still reads as a tennis day.
  static isTennis(day) {
    if (!day || !day.sports) return false;
    const tennis = (day.sports.Tennis && day.sports.Tennis.s) || 0;
    return tennis > 0 && tennis * 2 >= day.seconds;
  }

  // Local date parts: toISOString() would shift every cell back a day here.
  static key(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  render() {
    const container = this.container;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Match the GitHub calendar above: as many weeks as the column will hold.
    const containerWidth = container.offsetWidth || container.clientWidth || 512;
    const weeksToShow = Math.min(Math.floor(containerWidth / 14), 52);
    const daysToShow = weeksToShow * 7;

    const days = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const day = this.activityByDate[TrainingLive.key(date)] || null;
      days.push({ date: TrainingLive.key(date), dateObj: date, day });
    }

    const weeks = [];
    let currentWeek = [];

    days.forEach((entry, index) => {
      const dayOfWeek = entry.dateObj.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      if (index === 0 && adjustedDay > 0) {
        for (let i = 0; i < adjustedDay; i++) currentWeek.push(null);
      }

      currentWeek.push(entry);

      if (adjustedDay === 6) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      } else if (index === days.length - 1) {
        while (currentWeek.length < 7) currentWeek.push(null);
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    if (weeks.length > weeksToShow) weeks.splice(0, weeks.length - weeksToShow);

    container.innerHTML = `
      <div class="training-calendar w-full relative">
        <div id="training-tooltip" class="absolute hidden bg-gray-900 dark:bg-gray-700 text-white text-xs font-sans px-2 py-1 rounded shadow-lg pointer-events-none z-50 whitespace-nowrap"></div>
        <div class="flex gap-1 overflow-hidden">
          ${weeks.map((week) => `
            <div class="flex flex-col gap-1 flex-shrink-0">
              ${week.map((entry) => {
                if (!entry) return '<div class="w-2.5 h-2.5"></div>';
                const seconds = entry.day ? entry.day.seconds : 0;
                return `<div class="w-2.5 h-2.5 rounded-sm ${this.getColor(seconds)}${TrainingLive.isTennis(entry.day) ? ' training-tennis' : ''} border border-black/5 dark:border-white/10 transition-colors cursor-pointer" data-date="${entry.date}" data-text="${this.escape(this.describe(entry.day))}"></div>`;
              }).join('')}
            </div>
          `).join('')}
        </div>
        <figcaption class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span class="inline-flex items-center gap-1.5"><span class="inline-block w-2.5 h-2.5 rounded-sm bg-orange-400 dark:bg-orange-700 border border-black/5 dark:border-white/10"></span>Running</span>
          <span class="inline-flex items-center gap-1.5"><span class="inline-block w-2.5 h-2.5 rounded-sm bg-orange-400 dark:bg-orange-700 training-tennis border border-black/5 dark:border-white/10"></span>Tennis</span>
        </figcaption>
      </div>
    `;
    container.style.display = 'block';

    this.setupTooltip();
  }

  escape(text) {
    return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  // A run is a distance and tennis is a duration — quoting minutes for a run
  // says nothing about it, and quoting kilometres for tennis is meaningless
  // (the watch measures how far you ran around the court).
  static COVERS_GROUND = /^(run|trailrun|virtualrun|ride|virtualride|walk|hike|swim)$/;

  time(seconds) {
    const minutes = Math.round(seconds / 60);
    return minutes >= 60
      ? `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
      : `${minutes}m`;
  }

  describe(day) {
    if (!day) return 'Rest day';

    const sports = day.sports || {};
    const names = Object.keys(sports);
    if (!names.length) return `${this.time(day.seconds)} of training`;

    const parts = names.map((sport) => {
      const tally = sports[sport];
      // intervals.icu uses Strava's vocabulary; "WeightTraining" wants a space.
      const label = sport.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

      if (TrainingLive.COVERS_GROUND.test(sport.toLowerCase()) && tally.m) {
        return `${(tally.m / 1000).toFixed(1)} km ${label}`;
      }
      return `${this.time(tally.s)} of ${label}`;
    });

    return parts.join(' · ');
  }

  setupTooltip() {
    const tooltip = this.container.querySelector('#training-tooltip');
    const calendar = this.container.querySelector('.training-calendar');
    if (!tooltip || !calendar) return;

    this.container.querySelectorAll('[data-date]').forEach((square) => {
      square.addEventListener('mouseenter', () => {
        tooltip.textContent = `${square.getAttribute('data-text')} on ${this.formatDate(square.getAttribute('data-date'))}`;
        tooltip.classList.remove('hidden');

        const rect = square.getBoundingClientRect();
        const bounds = calendar.getBoundingClientRect();
        tooltip.style.left = `${rect.left - bounds.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - bounds.top}px`;
        tooltip.style.transform = 'translate(-50%, calc(-100% - 8px))';
      });

      square.addEventListener('mouseleave', () => tooltip.classList.add('hidden'));
    });
  }

  formatDate(dateStr) {
    const date = new Date(`${dateStr}T00:00:00`);
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const day = date.getDate();
    return `${months[date.getMonth()]} ${day}${this.ordinal(day)}`;
  }

  ordinal(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  setupResizeHandler() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.render(), 250);
    });
  }
}

document.addEventListener('DOMContentLoaded', function () {
  window.trainingLive = new TrainingLive(window.TRAINING_ACTIVITY);
});
