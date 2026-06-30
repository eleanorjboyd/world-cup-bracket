import { MATCHES, MATCHES_BY_ID, RESULTS, type Match, type Slot } from './bracket'

// picks: matchId -> winning teamId
export type Picks = Record<number, string>

// Resolve which team currently occupies a slot, given the picks so far.
// Returns undefined when the feeding match has not been decided yet.
export function resolveSlot(slot: Slot, picks: Picks): string | undefined {
  if (slot.kind === 'team') return slot.teamId
  return picks[slot.matchId]
}

export function teamsForMatch(
  match: Match,
  picks: Picks,
): { a: string | undefined; b: string | undefined } {
  return {
    a: resolveSlot(match.a, picks),
    b: resolveSlot(match.b, picks),
  }
}

// After a pick changes, some downstream picks may reference a team that can no
// longer reach that match. Repeatedly drop any pick that isn't one of its
// match's two currently-resolvable teams until the set is stable.
export function prune(picks: Picks): Picks {
  let next = { ...picks }
  let changed = true
  while (changed) {
    changed = false
    for (const match of MATCHES) {
      const picked = next[match.id]
      if (picked === undefined) continue
      const { a, b } = teamsForMatch(match, next)
      if (picked !== a && picked !== b) {
        delete next[match.id]
        changed = true
      }
    }
  }
  return next
}

export function setPick(picks: Picks, matchId: number, teamId: string): Picks {
  return prune({ ...picks, [matchId]: teamId })
}

// Force every already-played match to its real winner, then prune so any
// predictions that those results invalidate are cleared. Always run this when
// loading or mutating picks so finished games stay locked.
export function applyResults(picks: Picks): Picks {
  const forced: Picks = { ...picks }
  for (const [id, result] of Object.entries(RESULTS)) {
    forced[Number(id)] = result.winner
  }
  return prune(forced)
}

export function champion(picks: Picks): string | undefined {
  // The final is the highest match id in the data set.
  const finalId = Math.max(...MATCHES.map((m) => m.id))
  return picks[finalId]
}

export function isComplete(picks: Picks): boolean {
  return MATCHES.every((m) => picks[m.id] !== undefined)
}

export function matchById(id: number): Match {
  return MATCHES_BY_ID[id]
}
