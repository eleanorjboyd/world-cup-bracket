// 2026 FIFA World Cup knockout-stage data (48-team format).
// Source: live tournament bracket as of the group-stage completion.
// Rounds: Round of 32 -> Round of 16 -> Quarter-finals -> Semi-finals -> Final.

export type RoundId = 'R32' | 'R16' | 'QF' | 'SF' | 'F'

export interface Team {
  id: string
  name: string
  flag: string // emoji flag
}

// A slot is filled either by a known team (Round of 32) or by the winner of an
// earlier match (every later round).
export type Slot =
  | { kind: 'team'; teamId: string }
  | { kind: 'winner'; matchId: number }

export interface Match {
  id: number // official match number (73-104)
  round: RoundId
  a: Slot
  b: Slot
  date: string // e.g. "Jun 29"
  venue?: string
}

export const ROUNDS: { id: RoundId; label: string }[] = [
  { id: 'R32', label: 'Round of 32' },
  { id: 'R16', label: 'Round of 16' },
  { id: 'QF', label: 'Quarter-finals' },
  { id: 'SF', label: 'Semi-finals' },
  { id: 'F', label: 'Final' },
]

export const ROUND_LABEL: Record<RoundId, string> = Object.fromEntries(
  ROUNDS.map((r) => [r.id, r.label]),
) as Record<RoundId, string>

export const TEAMS: Record<string, Team> = {
  RSA: { id: 'RSA', name: 'South Africa', flag: '🇿🇦' },
  CAN: { id: 'CAN', name: 'Canada', flag: '🇨🇦' },
  BRA: { id: 'BRA', name: 'Brazil', flag: '🇧🇷' },
  JPN: { id: 'JPN', name: 'Japan', flag: '🇯🇵' },
  GER: { id: 'GER', name: 'Germany', flag: '🇩🇪' },
  PAR: { id: 'PAR', name: 'Paraguay', flag: '🇵🇾' },
  NED: { id: 'NED', name: 'Netherlands', flag: '🇳🇱' },
  MAR: { id: 'MAR', name: 'Morocco', flag: '🇲🇦' },
  CIV: { id: 'CIV', name: 'Ivory Coast', flag: '🇨🇮' },
  NOR: { id: 'NOR', name: 'Norway', flag: '🇳🇴' },
  FRA: { id: 'FRA', name: 'France', flag: '🇫🇷' },
  SWE: { id: 'SWE', name: 'Sweden', flag: '🇸🇪' },
  MEX: { id: 'MEX', name: 'Mexico', flag: '🇲🇽' },
  ECU: { id: 'ECU', name: 'Ecuador', flag: '🇪🇨' },
  ENG: { id: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  COD: { id: 'COD', name: 'DR Congo', flag: '🇨🇩' },
  USA: { id: 'USA', name: 'United States', flag: '🇺🇸' },
  BIH: { id: 'BIH', name: 'Bosnia & Herzegovina', flag: '🇧🇦' },
  BEL: { id: 'BEL', name: 'Belgium', flag: '🇧🇪' },
  SEN: { id: 'SEN', name: 'Senegal', flag: '🇸🇳' },
  ESP: { id: 'ESP', name: 'Spain', flag: '🇪🇸' },
  AUT: { id: 'AUT', name: 'Austria', flag: '🇦🇹' },
  POR: { id: 'POR', name: 'Portugal', flag: '🇵🇹' },
  CRO: { id: 'CRO', name: 'Croatia', flag: '🇭🇷' },
  SUI: { id: 'SUI', name: 'Switzerland', flag: '🇨🇭' },
  ALG: { id: 'ALG', name: 'Algeria', flag: '🇩🇿' },
  AUS: { id: 'AUS', name: 'Australia', flag: '🇦🇺' },
  EGY: { id: 'EGY', name: 'Egypt', flag: '🇪🇬' },
  ARG: { id: 'ARG', name: 'Argentina', flag: '🇦🇷' },
  CPV: { id: 'CPV', name: 'Cape Verde', flag: '🇨🇻' },
  COL: { id: 'COL', name: 'Colombia', flag: '🇨🇴' },
  GHA: { id: 'GHA', name: 'Ghana', flag: '🇬🇭' },
}

const team = (teamId: string): Slot => ({ kind: 'team', teamId })
const winner = (matchId: number): Slot => ({ kind: 'winner', matchId })

export const MATCHES: Match[] = [
  // ---------- Round of 32 ----------
  { id: 73, round: 'R32', a: team('RSA'), b: team('CAN'), date: 'Jun 28', venue: 'SoFi Stadium, Los Angeles' },
  { id: 74, round: 'R32', a: team('GER'), b: team('PAR'), date: 'Jun 29', venue: 'Gillette Stadium, Boston' },
  { id: 75, round: 'R32', a: team('NED'), b: team('MAR'), date: 'Jun 29' },
  { id: 76, round: 'R32', a: team('BRA'), b: team('JPN'), date: 'Jun 29', venue: 'NRG Stadium, Houston' },
  { id: 77, round: 'R32', a: team('FRA'), b: team('SWE'), date: 'Jun 30', venue: 'MetLife Stadium, New York' },
  { id: 78, round: 'R32', a: team('CIV'), b: team('NOR'), date: 'Jun 30', venue: 'AT&T Stadium, Dallas' },
  { id: 79, round: 'R32', a: team('MEX'), b: team('ECU'), date: 'Jun 30' },
  { id: 80, round: 'R32', a: team('ENG'), b: team('COD'), date: 'Jul 1', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 81, round: 'R32', a: team('USA'), b: team('BIH'), date: 'Jul 1', venue: "Levi's Stadium, San Francisco" },
  { id: 82, round: 'R32', a: team('BEL'), b: team('SEN'), date: 'Jul 1', venue: 'Lumen Field, Seattle' },
  { id: 83, round: 'R32', a: team('POR'), b: team('CRO'), date: 'Jul 2', venue: 'BMO Field, Toronto' },
  { id: 84, round: 'R32', a: team('ESP'), b: team('AUT'), date: 'Jul 2', venue: 'SoFi Stadium, Los Angeles' },
  { id: 85, round: 'R32', a: team('SUI'), b: team('ALG'), date: 'Jul 2', venue: 'BC Place, Vancouver' },
  { id: 86, round: 'R32', a: team('ARG'), b: team('CPV'), date: 'Jul 3', venue: 'Hard Rock Stadium, Miami' },
  { id: 87, round: 'R32', a: team('COL'), b: team('GHA'), date: 'Jul 3', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 88, round: 'R32', a: team('AUS'), b: team('EGY'), date: 'Jul 3', venue: 'AT&T Stadium, Dallas' },

  // ---------- Round of 16 ----------
  { id: 89, round: 'R16', a: winner(74), b: winner(77), date: 'Jul 4' },
  { id: 90, round: 'R16', a: winner(73), b: winner(75), date: 'Jul 4', venue: 'NRG Stadium, Houston' },
  { id: 91, round: 'R16', a: winner(76), b: winner(78), date: 'Jul 5', venue: 'MetLife Stadium, New York' },
  { id: 92, round: 'R16', a: winner(79), b: winner(80), date: 'Jul 5' },
  { id: 93, round: 'R16', a: winner(83), b: winner(84), date: 'Jul 6', venue: 'AT&T Stadium, Dallas' },
  { id: 94, round: 'R16', a: winner(81), b: winner(82), date: 'Jul 6' },
  { id: 95, round: 'R16', a: winner(86), b: winner(88), date: 'Jul 7', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 96, round: 'R16', a: winner(85), b: winner(87), date: 'Jul 7' },

  // ---------- Quarter-finals ----------
  { id: 97, round: 'QF', a: winner(89), b: winner(90), date: 'Jul 9', venue: 'Gillette Stadium, Boston' },
  { id: 98, round: 'QF', a: winner(93), b: winner(94), date: 'Jul 10', venue: 'SoFi Stadium, Los Angeles' },
  { id: 99, round: 'QF', a: winner(91), b: winner(92), date: 'Jul 11', venue: 'Hard Rock Stadium, Miami' },
  { id: 100, round: 'QF', a: winner(95), b: winner(96), date: 'Jul 11', venue: 'Arrowhead Stadium, Kansas City' },

  // ---------- Semi-finals ----------
  { id: 101, round: 'SF', a: winner(97), b: winner(98), date: 'Jul 14', venue: 'AT&T Stadium, Dallas' },
  { id: 102, round: 'SF', a: winner(99), b: winner(100), date: 'Jul 15', venue: 'Mercedes-Benz Stadium, Atlanta' },

  // ---------- Final ----------
  { id: 104, round: 'F', a: winner(101), b: winner(102), date: 'Jul 19', venue: 'MetLife Stadium, New York' },
]

export const MATCHES_BY_ID: Record<number, Match> = Object.fromEntries(
  MATCHES.map((m) => [m.id, m]),
)

// Real-world results for matches that have already been played. These are
// locked in the UI: the winner is forced and propagates forward, and users
// predict only the remaining (undecided) matches. Scores are in the match's
// a–b order. This is a fallback seed — the live values are fetched at runtime
// from public/results.json (auto-updated by the scheduled ESPN job).
export interface MatchResult {
  winner: string
  score: string
}

export const RESULTS: Record<number, MatchResult> = {
  73: { winner: 'CAN', score: '0–1' }, // South Africa 0–1 Canada
  74: { winner: 'PAR', score: '1–1 a.e.t. (pens)' }, // Germany 1–1 Paraguay, Paraguay on penalties
  75: { winner: 'MAR', score: '1–1 a.e.t. (pens)' }, // Netherlands 1–1 Morocco, Morocco on penalties
  76: { winner: 'BRA', score: '2–1' }, // Brazil 2–1 Japan
}

// The final is the highest-numbered match.
export const FINAL_ID = Math.max(...MATCHES.map((m) => m.id))

// Lay each round out top-to-bottom in true bracket order so that the two
// matches feeding a later match sit directly above/below it. We do a DFS from
// the final, building a path string ("0" = upper feeder, "1" = lower feeder);
// sorting a round's matches by that string yields the correct vertical order.
const ORDER_KEY: Record<number, string> = {}
function buildOrder(id: number, path: string) {
  ORDER_KEY[id] = path
  const m = MATCHES_BY_ID[id]
  if (m.a.kind === 'winner') buildOrder(m.a.matchId, path + '0')
  if (m.b.kind === 'winner') buildOrder(m.b.matchId, path + '1')
}
buildOrder(FINAL_ID, '')

export function matchesInBracketOrder(round: RoundId): Match[] {
  return MATCHES.filter((m) => m.round === round).sort((a, b) =>
    ORDER_KEY[a.id] < ORDER_KEY[b.id] ? -1 : 1,
  )
}

// Which half of the two-sided wall chart a match belongs to. The final has an
// empty path and sits in the center; everything else is left ('0') or right.
export type BracketSide = 'left' | 'right' | 'center'
export function bracketSide(id: number): BracketSide {
  const key = ORDER_KEY[id]
  if (!key) return 'center'
  return key[0] === '0' ? 'left' : 'right'
}
