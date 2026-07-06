// Simplified map
const TEAM_ALIASES = {
  'usa': 'united states', 'us': 'united states', 'usmnt': 'united states', 'united states': 'united states',
  'mexico': 'mexico', 'mex': 'mexico',
  'canada': 'canada', 'can': 'canada',
  'argentina': 'argentina', 'arg': 'argentina',
  'spain': 'spain', 'esp': 'spain',
  'france': 'france', 'fra': 'france',
  'brazil': 'brazil', 'bra': 'brazil',
  'england': 'england', 'eng': 'england',
  'nigeria': 'nigeria', 'nga': 'nigeria',
  'portugal': 'portugal', 'por': 'portugal',
};

import { keccak256, encodePacked } from 'viem';

export const footballPlugin = {
  id: 'football_wc2026',
  
  parseConditionClause(intentCondition) {
    if (!intentCondition || !intentCondition.params) return null;
    const { teamA, teamB, outcome, rawScore } = intentCondition.params;

    const normA = TEAM_ALIASES[teamA?.toLowerCase()] || teamA?.toLowerCase();
    const normB = TEAM_ALIASES[teamB?.toLowerCase()] || teamB?.toLowerCase();
    
    // Fallback if we can't parse teams
    if (!normA) return null;

    // canonical representation
    const conditionStr = `wc2026:${normA}:${normB || 'any'}:${outcome || 'win'}:${rawScore || 'any'}`;
    const conditionHash = keccak256(encodePacked(['string'], [conditionStr]));

    return {
      conditionStr,
      conditionHash,
      metadata: { teamA: normA, teamB: normB, outcome, rawScore }
    };
  },

  evaluateCondition(metadata, matchData) {
    const { teamA, teamB, outcome, rawScore } = metadata;
    // matchData from oracle DB: { homeTeam, awayTeam, homeScore, awayScore, status }

    if (matchData.status !== 'FINISHED') return null; // pending

    let teamAScore, teamBScore;
    if (matchData.homeTeam === teamA) {
      teamAScore = matchData.homeScore;
      teamBScore = matchData.awayScore;
    } else if (matchData.awayTeam === teamA) {
      teamAScore = matchData.awayScore;
      teamBScore = matchData.homeScore;
    } else {
      return false; // Team A didn't play in this match
    }

    if (outcome === 'win') {
      return teamAScore > teamBScore;
    } else if (outcome === 'draw') {
      return teamAScore === teamBScore;
    } else if (outcome === 'lose') {
      return teamAScore < teamBScore;
    } else if (rawScore) {
      // e.g. "2-1"
      const [expectedA, expectedB] = rawScore.split('-').map(Number);
      return teamAScore === expectedA && teamBScore === expectedB;
    }

    return false;
  }
};
