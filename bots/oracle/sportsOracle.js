import { getSupabase } from '../db/supabase.js';

async function fetchFootballData() {
  const token = process.env.FOOTBALL_DATA_API_KEY;
  if (!token) return null;
  
  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: { 'X-Auth-Token': token }
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.matches || []).map(m => ({
      homeTeam: m.homeTeam?.name?.toLowerCase(),
      awayTeam: m.awayTeam?.name?.toLowerCase(),
      homeScore: m.score?.fullTime?.home,
      awayScore: m.score?.fullTime?.away,
      status: m.status === 'FINISHED' ? 'finished' : 'live'
    }));
  } catch (e) {
    return null;
  }
}

export async function syncMatchResults() {
  console.log('[Oracle] Syncing match results...');
  
  const matches = await fetchFootballData();
  if (!matches) {
    console.warn('[Oracle] Could not fetch matches from API.');
    return;
  }

  const supabase = getSupabase();
  
  // We only insert or update finished matches for simplicity in this port
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
    }
  }
  
  console.log(`[Oracle] Synced ${matches.filter(m => m.status === 'finished').length} finished matches.`);
}
