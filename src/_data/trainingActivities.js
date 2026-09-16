const axios = require('axios');
const backfill = require('./trainingBackfill.json');

// `--serve`/`--watch` is local dev: a dead key shouldn't take the whole
// site down over a decorative graph. Real builds still hard-fail.
const isDevServer = process.argv.includes('--serve') || process.argv.includes('--watch');

// The grid draws a year, so only a year of history needs to travel with the
// page. A few days of slack keeps the oldest column whole.
const WINDOW_DAYS = 372;

// COROS only reaches back to the day the watch was paired; everything before
// that lives in a one-off Strava export, parsed into trainingBackfill.json.
// Live days win on a collision — the same session synced through intervals.icu
// carries better numbers than the CSV row does.
function merge(live) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - WINDOW_DAYS);
  const floor = iso(cutoff);

  const merged = {};
  Object.entries(backfill).forEach(([date, day]) => {
    if (date >= floor) merged[date] = day;
  });
  Object.entries(live).forEach(([date, day]) => {
    if (date >= floor) merged[date] = day;
  });
  return merged;
}

const empty = () => ({ activityByDate: merge({}), lastUpdated: new Date().toISOString() });

// Moving time discounts the stops in continuous locomotion — waiting at a
// crossing does not count as running. In a stop-start sport it deletes the
// match: a tennis match can be 2h54m elapsed and 1h29m moving, because
// changeovers and the walk between points are most of the clock.
const CONTINUOUS = /^(run|trailrun|virtualrun|ride|virtualride|walk|hike|swim|rowing|kayaking)$/;

function duration(activity) {
  const moving = Math.round(activity.moving_time || 0);
  const elapsed = Math.round(activity.elapsed_time || 0);
  return CONTINUOUS.test((activity.type || '').toLowerCase())
    ? moving || elapsed
    : elapsed || moving;
}

// Local date parts, not toISOString() — that shifts every date back a day east
// of UTC, which would file a Monday morning session under the Sunday before.
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// intervals.icu pulls completed activities from COROS, so the watch stays the
// source of truth and the build only ever talks to one API. The key is read at
// build time and never reaches the browser — see narrow.njk, which dumps the
// aggregated days only.
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

    // Every sport counts, not just running — tennis is most of the summer. Only
    // days with something on them are kept; the renderer treats a missing date
    // as a rest day, which keeps the payload injected into the page small.
    const activityByDate = {};

    activities.forEach((activity) => {
      // start_date_local is already in the athlete's own timezone, so slicing the
      // date off it buckets a late-evening session on the day it happened.
      const date = (activity.start_date_local || activity.start_date || '').split('T')[0];
      if (!date) return;

      const seconds = duration(activity);
      const metres = Math.round(activity.distance || 0);

      const day = activityByDate[date] || { count: 0, seconds: 0, sports: {} };
      day.count += 1;
      day.seconds += seconds;

      // Per sport, so the tooltip can give a run its kilometres and a tennis
      // match its hours rather than one number for a mixed day.
      const sport = activity.type || 'Workout';
      const tally = day.sports[sport] || { s: 0 };
      tally.s += seconds;
      if (metres) tally.m = (tally.m || 0) + metres;
      day.sports[sport] = tally;

      activityByDate[date] = day;
    });

    const merged = merge(activityByDate);

    console.log(
      `✅ Fetched ${activities.length} activities across ${Object.keys(activityByDate).length} days from intervals.icu` +
      ` (${Object.keys(merged).length} days after the Strava backfill)`
    );

    return { activityByDate: merged, lastUpdated: new Date().toISOString() };
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
