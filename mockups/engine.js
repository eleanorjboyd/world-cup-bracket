// Shared bracket engine + 2026 World Cup knockout data for the mockups.
// Standalone (no build step). Pick propagation matches the real app.

const FLAG = {
  RSA: ['South Africa', '🇿🇦'], CAN: ['Canada', '🇨🇦'],
  BRA: ['Brazil', '🇧🇷'], JPN: ['Japan', '🇯🇵'],
  GER: ['Germany', '🇩🇪'], PAR: ['Paraguay', '🇵🇾'],
  NED: ['Netherlands', '🇳🇱'], MAR: ['Morocco', '🇲🇦'],
  CIV: ['Ivory Coast', '🇨🇮'], NOR: ['Norway', '🇳🇴'],
  FRA: ['France', '🇫🇷'], SWE: ['Sweden', '🇸🇪'],
  MEX: ['Mexico', '🇲🇽'], ECU: ['Ecuador', '🇪🇨'],
  ENG: ['England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'], COD: ['DR Congo', '🇨🇩'],
  USA: ['United States', '🇺🇸'], BIH: ['Bosnia & Herz.', '🇧🇦'],
  BEL: ['Belgium', '🇧🇪'], SEN: ['Senegal', '🇸🇳'],
  ESP: ['Spain', '🇪🇸'], AUT: ['Austria', '🇦🇹'],
  POR: ['Portugal', '🇵🇹'], CRO: ['Croatia', '🇭🇷'],
  SUI: ['Switzerland', '🇨🇭'], ALG: ['Algeria', '🇩🇿'],
  AUS: ['Australia', '🇦🇺'], EGY: ['Egypt', '🇪🇬'],
  ARG: ['Argentina', '🇦🇷'], CPV: ['Cape Verde', '🇨🇻'],
  COL: ['Colombia', '🇨🇴'], GHA: ['Ghana', '🇬🇭'],
};

const t = (c) => ({ team: c });
const w = (id) => ({ win: id });

const MATCHES = [
  // Round of 32
  { id: 73, r: 'R32', a: t('RSA'), b: t('CAN'), d: 'Jun 28', v: 'SoFi Stadium, Los Angeles' },
  { id: 74, r: 'R32', a: t('GER'), b: t('PAR'), d: 'Jun 29', v: 'Gillette Stadium, Boston' },
  { id: 75, r: 'R32', a: t('NED'), b: t('MAR'), d: 'Jun 29', v: '' },
  { id: 76, r: 'R32', a: t('BRA'), b: t('JPN'), d: 'Jun 29', v: 'NRG Stadium, Houston' },
  { id: 77, r: 'R32', a: t('FRA'), b: t('SWE'), d: 'Jun 30', v: 'MetLife Stadium, New York' },
  { id: 78, r: 'R32', a: t('CIV'), b: t('NOR'), d: 'Jun 30', v: 'AT&T Stadium, Dallas' },
  { id: 79, r: 'R32', a: t('MEX'), b: t('ECU'), d: 'Jun 30', v: '' },
  { id: 80, r: 'R32', a: t('ENG'), b: t('COD'), d: 'Jul 1', v: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 81, r: 'R32', a: t('USA'), b: t('BIH'), d: 'Jul 1', v: "Levi's Stadium, San Francisco" },
  { id: 82, r: 'R32', a: t('BEL'), b: t('SEN'), d: 'Jul 1', v: 'Lumen Field, Seattle' },
  { id: 83, r: 'R32', a: t('POR'), b: t('CRO'), d: 'Jul 2', v: 'BMO Field, Toronto' },
  { id: 84, r: 'R32', a: t('ESP'), b: t('AUT'), d: 'Jul 2', v: 'SoFi Stadium, Los Angeles' },
  { id: 85, r: 'R32', a: t('SUI'), b: t('ALG'), d: 'Jul 2', v: 'BC Place, Vancouver' },
  { id: 86, r: 'R32', a: t('ARG'), b: t('CPV'), d: 'Jul 3', v: 'Hard Rock Stadium, Miami' },
  { id: 87, r: 'R32', a: t('COL'), b: t('GHA'), d: 'Jul 3', v: 'Arrowhead Stadium, Kansas City' },
  { id: 88, r: 'R32', a: t('AUS'), b: t('EGY'), d: 'Jul 3', v: 'AT&T Stadium, Dallas' },
  // Round of 16
  { id: 89, r: 'R16', a: w(74), b: w(77), d: 'Jul 4', v: '' },
  { id: 90, r: 'R16', a: w(73), b: w(75), d: 'Jul 4', v: 'NRG Stadium, Houston' },
  { id: 91, r: 'R16', a: w(76), b: w(78), d: 'Jul 5', v: 'MetLife Stadium, New York' },
  { id: 92, r: 'R16', a: w(79), b: w(80), d: 'Jul 5', v: '' },
  { id: 93, r: 'R16', a: w(83), b: w(84), d: 'Jul 6', v: 'AT&T Stadium, Dallas' },
  { id: 94, r: 'R16', a: w(81), b: w(82), d: 'Jul 6', v: '' },
  { id: 95, r: 'R16', a: w(86), b: w(88), d: 'Jul 7', v: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 96, r: 'R16', a: w(85), b: w(87), d: 'Jul 7', v: '' },
  // Quarter-finals
  { id: 97, r: 'QF', a: w(89), b: w(90), d: 'Jul 9', v: 'Gillette Stadium, Boston' },
  { id: 98, r: 'QF', a: w(93), b: w(94), d: 'Jul 10', v: 'SoFi Stadium, Los Angeles' },
  { id: 99, r: 'QF', a: w(91), b: w(92), d: 'Jul 11', v: 'Hard Rock Stadium, Miami' },
  { id: 100, r: 'QF', a: w(95), b: w(96), d: 'Jul 11', v: 'Arrowhead Stadium, Kansas City' },
  // Semi-finals
  { id: 101, r: 'SF', a: w(97), b: w(98), d: 'Jul 14', v: 'AT&T Stadium, Dallas' },
  { id: 102, r: 'SF', a: w(99), b: w(100), d: 'Jul 15', v: 'Mercedes-Benz Stadium, Atlanta' },
  // Final
  { id: 104, r: 'F', a: w(101), b: w(102), d: 'Jul 19', v: 'MetLife Stadium, New York' },
];

const BY_ID = {};
MATCHES.forEach((m) => (BY_ID[m.id] = m));
const FINAL_ID = 104;

const ROUND_LABEL = {
  R32: 'Round of 32', R16: 'Round of 16', QF: 'Quarter-finals',
  SF: 'Semi-finals', F: 'Final',
};
const ROUND_IDS = ['R32', 'R16', 'QF', 'SF', 'F'];

// Bracket-order path: "0" = upper feeder, "1" = lower feeder.
const PATH = {};
(function build(id, p) {
  PATH[id] = p;
  const m = BY_ID[id];
  if (m.a.win) build(m.a.win, p + '0');
  if (m.b.win) build(m.b.win, p + '1');
})(FINAL_ID, '');

function inBracketOrder(round) {
  return MATCHES.filter((m) => m.r === round).sort((a, b) =>
    PATH[a.id] < PATH[b.id] ? -1 : 1
  );
}

// ---- pick state (per-mockup storage key) ----
function createStore(key) {
  let picks = {};
  try { picks = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}

  const resolve = (slot) => (slot.team ? slot.team : picks[slot.win]);
  const teamsOf = (m) => [resolve(m.a), resolve(m.b)];

  function prune() {
    let changed = true;
    while (changed) {
      changed = false;
      for (const m of MATCHES) {
        const p = picks[m.id];
        if (p == null) continue;
        const [a, b] = teamsOf(m);
        if (p !== a && p !== b) { delete picks[m.id]; changed = true; }
      }
    }
  }

  return {
    get picks() { return picks; },
    resolve,
    teamsOf,
    winner: (id) => picks[id],
    champion: () => picks[FINAL_ID],
    count: () => Object.keys(picks).length,
    pick(id, team) {
      if (!team) return;
      picks[id] = team;
      prune();
      localStorage.setItem(key, JSON.stringify(picks));
    },
    reset() { picks = {}; localStorage.setItem(key, '{}'); },
  };
}

function name(code) { return code ? FLAG[code][0] : ''; }
function flag(code) { return code ? FLAG[code][1] : ''; }
