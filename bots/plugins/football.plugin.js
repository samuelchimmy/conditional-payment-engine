import { keccak256, stringToBytes } from 'viem';

const TEAM_ALIASES = {
  // Group A
  'usa': 'united states', 'us': 'united states', 'usmnt': 'united states',
  'united states': 'united states', 'america': 'united states', '🇺🇸': 'united states',

  'mexico': 'mexico', 'mex': 'mexico', 'el tri': 'mexico', '🇲🇽': 'mexico',
  'canada': 'canada', 'can': 'canada', 'canmnt': 'canada', '🇨🇦': 'canada',

  // Group B
  'argentina': 'argentina', 'arg': 'argentina', 'albiceleste': 'argentina',
  'la albiceleste': 'argentina', '🇦🇷': 'argentina', 'messi team': 'argentina',
  'chile': 'chile', 'chi': 'chile', 'la roja': 'chile', '🇨🇱': 'chile',
  'peru': 'peru', 'per': 'peru', '🇵🇪': 'peru',
  'australia': 'australia', 'aus': 'australia', 'socceroos': 'australia', '🇦🇺': 'australia',

  // Group C
  'spain': 'spain', 'esp': 'spain', 'la roja esp': 'spain', '🇪🇸': 'spain',
  'portugal': 'portugal', 'por': 'portugal', 'selecao': 'portugal', 'seleção': 'portugal',
  'la selecao': 'portugal', '🇵🇹': 'portugal', 'ronaldo team': 'portugal',
  'morocco': 'morocco', 'mar': 'morocco', 'atlas lions': 'morocco', '🇲🇦': 'morocco', 'maroc': 'morocco',
  'uruguay': 'uruguay', 'uru': 'uruguay', 'la celeste': 'uruguay', '🇺🇾': 'uruguay',

  // Group D
  'france': 'france', 'fra': 'france', 'les bleus': 'france', '🇫🇷': 'france',
  'brazil': 'brazil', 'bra': 'brazil', 'brasil': 'brazil', 'seleção bra': 'brazil',
  'canarinho': 'brazil', '🇧🇷': 'brazil', 'selecao bra': 'brazil',
  'colombia': 'colombia', 'col': 'colombia', 'los cafeteros': 'colombia', '🇨🇴': 'colombia',
  'england': 'england', 'eng': 'england', 'three lions': 'england', '🏴󠁧󠁢󠁥󠁮󠁧󠁿': 'england',

  // Group E
  'germany': 'germany', 'ger': 'germany', 'die mannschaft': 'germany', '🇩🇪': 'germany', 'mannschaft': 'germany',
  'japan': 'japan', 'jpn': 'japan', 'samurai blue': 'japan', '🇯🇵': 'japan',
  'belgium': 'belgium', 'bel': 'belgium', 'red devils': 'belgium', '🇧🇪': 'belgium',
  'saudi arabia': 'saudi arabia', 'ksa': 'saudi arabia', 'saudi': 'saudi arabia', '🇸🇦': 'saudi arabia',

  // Group F
  'netherlands': 'netherlands', 'ned': 'netherlands', 'holland': 'netherlands', 'oranje': 'netherlands', '🇳🇱': 'netherlands', 'dutch': 'netherlands',
  'ecuador': 'ecuador', 'ecu': 'ecuador', 'la tri': 'ecuador', '🇪🇨': 'ecuador',
  'senegal': 'senegal', 'sen': 'senegal', 'lions of teranga': 'senegal', '🇸🇳': 'senegal', 'teranga lions': 'senegal',
  'iran': 'iran', 'irn': 'iran', 'team melli': 'iran', '🇮🇷': 'iran',

  // Group G
  'switzerland': 'switzerland', 'sui': 'switzerland', 'die nati': 'switzerland', '🇨🇭': 'switzerland', 'swiss': 'switzerland',
  'cameroon': 'cameroon', 'cmr': 'cameroon', 'indomitable lions': 'cameroon', '🇨🇲': 'cameroon',
  'serbia': 'serbia', 'srb': 'serbia', 'vatreni': 'serbia', '🇷🇸': 'serbia',
  'new zealand': 'new zealand', 'nzl': 'new zealand', 'all whites': 'new zealand', '🇳🇿': 'new zealand',

  // Group H
  'croatia': 'croatia', 'cro': 'croatia', 'vatreni2': 'croatia', '🇭🇷': 'croatia', 'checkered': 'croatia',
  'south africa': 'south africa', 'rsa': 'south africa', 'bafana bafana': 'south africa', 'bafana': 'south africa', '🇿🇦': 'south africa',
  'south korea': 'south korea', 'kor': 'south korea', 'korea': 'south korea', 'taeguk warriors': 'south korea', '🇰🇷': 'south korea',
  'ukraine': 'ukraine', 'ukr': 'ukraine', '🇺🇦': 'ukraine',

  // Group I
  'costa rica': 'costa rica', 'crc': 'costa rica', 'ticos': 'costa rica', '🇨🇷': 'costa rica',
  'qatar': 'qatar', 'qat': 'qatar', 'maroons': 'qatar', '🇶🇦': 'qatar',
  'panama': 'panama', 'pan': 'panama', 'canaleros': 'panama', '🇵🇦': 'panama',

  // Group J
  'italy': 'italy', 'ita': 'italy', 'azzurri': 'italy', '🇮🇹': 'italy',
  'egypt': 'egypt', 'egy': 'egypt', 'pharaohs': 'egypt', '🇪🇬': 'egypt',
  'austria': 'austria', 'aut': 'austria', '🇦🇹': 'austria',

  // Group K
  'ghana': 'ghana', 'gha': 'ghana', 'black stars': 'ghana', '🇬🇭': 'ghana',
  'hungary': 'hungary', 'hun': 'hungary', '🇭🇺': 'hungary',
  'indonesia': 'indonesia', 'idn': 'indonesia', 'garuda': 'indonesia', '🇮🇩': 'indonesia',

  // Group L
  'nigeria': 'nigeria', 'nga': 'nigeria', 'super eagles': 'nigeria', '🇳🇬': 'nigeria', 'eagles': 'nigeria',
  'denmark': 'denmark', 'den': 'denmark', 'danish dynamite': 'denmark', '🇩🇰': 'denmark',
  'poland': 'poland', 'pol': 'poland', 'bialo-czerwoni': 'poland', '🇵🇱': 'poland',

  // API-official / FIFA names → canonical (so oracle-stored names match bet aliases)
  'korea republic': 'south korea', 'republic of korea': 'south korea', 'rep of korea': 'south korea',
  'ir iran': 'iran', 'iran (islamic republic of)': 'iran',
  'united states of america': 'united states', 'usmnt': 'united states',
  'china pr': 'china', 'côte d’ivoire': 'ivory coast', "cote d'ivoire": 'ivory coast',
  'türkiye': 'turkey', 'turkiye': 'turkey',
};

export function resolveAlias(name) {
  if (!name) return null;
  const clean = name.toLowerCase().trim();
  return TEAM_ALIASES[clean] || clean;
}

export const footballPlugin = {
  id: 'football_wc2026',

  parseConditionClause(clause) {
    if (!clause || typeof clause !== 'object') return null;

    // Extract params from the AI-parsed condition object
    const params = clause.params || {};
    const teamA = resolveAlias(params.teamA || '');
    const teamB = resolveAlias(params.teamB || '');
    const outcome = params.outcome || 'win'; // 'win' | 'lose' | 'draw'
    const rawText = clause.rawText || JSON.stringify(params);

    // Build a canonical condition string for hashing
    const conditionStr = teamB
      ? `${teamA}:${outcome}:vs:${teamB}`
      : `${teamA}:${outcome}`;

    // Compute deterministic conditionHash — keccak256 of canonical string
    // This is what gets recorded on-chain in the IOURegistry
    const conditionHash = keccak256(stringToBytes(conditionStr));

    return {
      type: 'football_match',
      conditionHash,
      conditionStr,
      metadata: { teamA, teamB, outcome, rawText },
    };
  },

  evaluateCondition(meta, matchData) {
    if (matchData.status !== 'FINISHED') return null; // Wait for match

    const targetTeam = resolveAlias(meta.teamA);
    const homeTeam = resolveAlias(matchData.homeTeam);
    const awayTeam = resolveAlias(matchData.awayTeam);

    const isHome = targetTeam === homeTeam;
    const isAway = targetTeam === awayTeam;

    if (!isHome && !isAway) return null; // Match doesn't involve our team

    const { homeScore, awayScore } = matchData;
    const isDraw = homeScore === awayScore;
    const targetWon = (isHome && homeScore > awayScore) || (isAway && awayScore > homeScore);

    // CR-5: honor the actual predicted outcome (win / lose / draw), not just "win".
    const outcome = (meta.outcome || 'win').toLowerCase();
    switch (outcome) {
      case 'lose':
      case 'loss':
        return !isDraw && !targetWon; // target lost
      case 'draw':
      case 'tie':
        return isDraw;
      case 'win':
      default:
        return targetWon;
    }
  }
};
