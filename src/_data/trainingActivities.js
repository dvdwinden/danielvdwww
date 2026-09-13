const axios = require('axios');

// `--serve`/`--watch` is local dev: a dead key shouldn't take the whole
// site down over a decorative graph. Real builds still hard-fail.
const isDevServer = process.argv.includes('--serve') || process.argv.includes('--watch');

const empty = () => ({ activityByDate: {}, lastUpdated: new Date().toISOString() });

// intervals.icu pulls completed activities from COROS, so the watch stays the
// source of truth and the build only ever talks to one API. The key is read at
// build time and never reaches the browser — see base.njk, which dumps the
// aggregated counts only.
module.exports = async function () {
  const athleteId = process.env.INTERVALS_ATHLETE_ID;
  const apiKey = process.env.INTERVALS_API_KEY;

  if (!athleteId || !apiKey) {
    if (process.env.CI) {
      throw new Error(
        'INTERVALS_ATHLETE_ID / INTERVALS_API_KEY are not set — check the secrets in GitHub Actions.'
      );
    }
    console.warn('⚠️  intervals.icu credentials not found in environment variables');
    return empty();
  }

  try {
    console.log('Fetching training activities from intervals.icu...');

    const newest = new Date();
    const oldest = new Date();
    oldest.setFullYear(oldest.getFullYear() - 1);

    const iso = (d) => d.toISOString().split('T')[0];

    const response = await axios.get(
      `https://intervals.icu/api/v1/athlete/${athleteId}/activities`,
      {
        params: { oldest: iso(oldest), newest: iso(newest) },
        // Basic auth with the literal username "API_KEY"; the key is the password.
        auth: { username: 'API_KEY', password: apiKey },
        timeout: 30000
      }
    );

    const activities = Array.isArray(response.data) ? response.data : [];

    // Only days with activity are kept — the renderer treats a missing date as a
    // rest day, which keeps the payload injected into every page small.
    const activityByDate = {};

    activities.forEach((activity) => {
      // start_date_local is already in the athlete's own timezone, so slicing the
      // date off it buckets a late-evening run on the day it was actually run.
      const date = (activity.start_date_local || activity.start_date || '').split('T')[0];
      if (!date) return;

      const day = activityByDate[date] || { count: 0, seconds: 0, metres: 0 };
      day.count += 1;
      day.seconds += Math.round(activity.moving_time || activity.elapsed_time || 0);
      day.metres += Math.round(activity.distance || 0);
      activityByDate[date] = day;
    });

    console.log(
      `✅ Fetched ${activities.length} activities across ${Object.keys(activityByDate).length} days from intervals.icu`
    );

    return { activityByDate, lastUpdated: new Date().toISOString() };
  } catch (error) {
    const status = error.response?.status;

    // Auth/config problems are silent killers — this is exactly how the old Strava
    // calendar died, shipping an empty grid for months. Fail the build instead.
    if (status === 401 || status === 403) {
      const message =
        `❌ intervals.icu auth failed (${status}): ${error.message}\n` +
        `   Regenerate the key under intervals.icu → Settings → Developer Settings\n` +
        `   and update the INTERVALS_API_KEY secret.`;

      if (!isDevServer) {
        throw new Error(message);
      }

      console.error(message);
      console.error('   Dev server: continuing with an empty training graph.');
      console.error('   Already updated .env? Restart `npm run dev` — dotenv only reads it at startup.');
      return empty();
    }

    // Transient network trouble shouldn't block a deploy.
    console.error('❌ Error fetching training activities:', error.message);
    return empty();
  }
};
