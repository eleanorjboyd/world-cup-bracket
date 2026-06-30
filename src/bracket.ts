// 2026 FIFA World Cup knockout-stage logic. The bracket data (teams + match
// tree) lives in ./data/bracket.json — the single source of truth shared with
// scripts/fetch-results.mjs.

import bracketData from './data/bracket.json'

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

type RawSlot = { team: string } | { win: number }
interface RawMatch {
  id: number
  round: string
  a: RawSlot
  b: RawSlot
  date: string
  venue?: string
}
const data = bracketData as unknown as {
  teams: Record<string, [string, string]>
  matches: RawMatch[]
}

export const TEAMS: Record<string, Team> = Object.fromEntries(
  Object.entries(data.teams).map(([id, [name, flag]]) => [id, { id, name, flag }]),
)

function toSlot(s: RawSlot): Slot {
  return 'team' in s
    ? { kind: 'team', teamId: s.team }
    : { kind: 'winner', matchId: s.win }
}

export const MATCHES: Match[] = data.matches.map((m) => ({
  id: m.id,
  round: m.round as RoundId,
  a: toSlot(m.a),
  b: toSlot(m.b),
  date: m.date,
  venue: m.venue,
}))

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
