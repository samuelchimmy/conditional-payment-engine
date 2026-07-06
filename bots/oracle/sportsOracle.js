import { getSupabase } from '../db/supabase.js';

// Reusing normalizeTeamName to ensure uniform database keys
export function normalizeTeamName(rawName) {
  if (!rawName) return null;
  let s = rawName.toString().toLowerCase().trim();
  s = s.replace(/[.*+?^${}()|[\]\\]/g, ''); // strip regex chars
  return s;
}

// ── 3-Source API Fetching ─────────────────────────────────────────────────────

async function fetchFootballData() {
  const token = process.env.FOOTBALL_DATA_API_KEY || process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    console.warn('[SportsOracle] ⚠️ Missing FOOTBALL_DATA_API_KEY env var — skipping Primary source');
    return null;
  }
  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: { 'X-Auth-Token': token, 'User-Agent': 'TetherArena/2.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return (json.matches || []).map(m => ({
      homeTeam: normalizeTeamName(m.homeTeam?.name),
      awayTeam: normalizeTeamName(m.awayTeam?.name),
      homeScore: m.score?.fullTime?.home !== undefined && m.score?.fullTime?.home !== null
        ? (m.score.duration === 'PENALTY_SHOOTOUT'
            ? Number(m.score.regularTime?.home || 0) + Number(m.score.extraTime?.home || 0)
            : Number(m.score.fullTime.home))
        : null,
      awayScore: m.score?.fullTime?.away !== undefined && m.score?.fullTime?.away !== null
        ? (m.score.duration === 'PENALTY_SHOOTOUT'
            ? Number(m.score.regularTime?.away || 0) + Number(m.score.extraTime?.away || 0)
            : Number(m.score.fullTime.away))
        : null,
      finished: m.status === 'FINISHED',
      status: m.status === 'FINISHED' ? 'finished' : (m.status === 'IN_PLAY' || m.status === 'PAUSED' ? 'live' : 'notstarted'),
    }));
  } catch (err) {
    console.warn(`[SportsOracle] ⚠️ Primary (football-data.org) failed: ${err.message}`);
    return null;
  }
}

async function fetchApiFootball() {
  const token = process.env.API_FOOTBALL_API_KEY || process.env.API_FOOTBALL_KEY;
  if (!token) {
    console.warn('[SportsOracle] ⚠️ Missing API_FOOTBALL_API_KEY env var — skipping Fallback source');
    return null;
  }
  try {
    // League 1 is World Cup in API-Football
    const res = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026', {
      headers: { 'x-apisports-key': token, 'User-Agent': 'TetherArena/2.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return (json.response || []).map(r => {
      const statusShort = r.fixture?.status?.short;
      const finished = ['FT', 'AET', 'PEN'].includes(statusShort);
      const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'BT'].includes(statusShort);
      return {
        homeTeam: normalizeTeamName(r.teams?.home?.name),
        awayTeam: normalizeTeamName(r.teams?.away?.name),
        homeScore: r.goals?.home !== undefined && r.goals?.home !== null ? Number(r.goals.home) : null,
        awayScore: r.goals?.away !== undefined && r.goals?.away !== null ? Number(r.goals.away) : null,
        finished,
        status: finished ? 'finished' : isLive ? 'live' : 'notstarted',
      };
    });
  } catch (err) {
    console.warn(`[SportsOracle] ⚠️ Fallback (API-Football) failed: ${err.message}`);
    return null;
  }
}

async function fetchOpenFootball() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/openfootball/world-cup/master/2026/worldcup.json', {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const matches = [];
    if (json.rounds) {
      for (const round of json.rounds) {
        if (!round.matches) continue;
        for (const m of round.matches) {
          const homeTeam = normalizeTeamName(m.team1?.name);
          const awayTeam = normalizeTeamName(m.team2?.name);
          const homeScore = m.score?.ft ? m.score.ft[0] : null;
          const awayScore = m.score?.ft ? m.score.ft[1] : null;
          // OpenFootball only updates after games
          const finished = homeScore !== null && awayScore !== null;
          matches.push({
            homeTeam,
            awayTeam,
            homeScore,
            awayScore,
            finished,
            status: finished ? 'finished' : 'notstarted',
          });
        }
      }
    }
    return matches;
  } catch (err) {
    console.warn(`[SportsOracle] ⚠️ Fallback 2 (OpenFootball) failed: ${err.message}`);
    return null;
  }
}

export async function syncMatchResults() {
  console.log('[Oracle] Syncing match results from 3-Source Fallback System...');
  
  let matches = await fetchFootballData();
  
  if (!matches) {
    console.log('[Oracle] Primary source failed, attempting API-Football fallback...');
    matches = await fetchApiFootball();
  }
  
  if (!matches) {
    console.log('[Oracle] API-Football failed, attempting OpenFootball sanity check fallback...');
    matches = await fetchOpenFootball();
  }

  if (!matches) {
    console.error('[Oracle] 🛑 ALL ORACLE SOURCES FAILED. Cannot sync match results.');
    return;
  }

  const supabase = getSupabase();
  let syncedCount = 0;
  
  for (const match of matches) {
    if (match.status !== 'finished') continue;

    const { error } = await supabase
      .from('sports_match_results')
      .upsert({
        home_team: match.homeTeam,
        away_team: match.awayTeam,
        home_score: match.homeScore,
        away_score: match.awayScore,
        status: match.status,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'home_team,away_team' 
      });
      
    if (error) {
      console.error(`[Oracle] Failed to sync match ${match.homeTeam} vs ${match.awayTeam}:`, error);
    } else {
      syncedCount++;
    }
  }
  
  console.log(`[Oracle] Synced ${syncedCount} finished matches successfully.`);
}
