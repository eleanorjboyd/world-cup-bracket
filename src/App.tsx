import { useEffect, useMemo, useState } from 'react'
import {
  MATCHES,
  ROUNDS,
  TEAMS,
  type Match,
  type RoundId,
  type Slot,
} from './bracket'
import {
  champion,
  isComplete,
  setPick,
  teamsForMatch,
  type Picks,
} from './picks'

const STORAGE_KEY = 'wc2026-bracket-picks-v1'

function loadPicks(): Picks {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Picks) : {}
  } catch {
    return {}
  }
}

function slotLabel(slot: Slot): string {
  return slot.kind === 'winner' ? `Winner of Match ${slot.matchId}` : 'TBD'
}

export default function App() {
  const [picks, setPicks] = useState<Picks>(loadPicks)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(picks))
  }, [picks])

  const matchesByRound = useMemo(() => {
    const map: Record<RoundId, Match[]> = {
      R32: [],
      R16: [],
      QF: [],
      SF: [],
      F: [],
    }
    for (const m of MATCHES) map[m.round].push(m)
    return map
  }, [])

  const championId = champion(picks)
  const complete = isComplete(picks)
  const pickedCount = Object.keys(picks).length

  function pick(matchId: number, teamId: string | undefined) {
    if (!teamId) return
    setPicks((prev) => setPick(prev, matchId, teamId))
  }

  function reset() {
    setPicks({})
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>World Cup 2026 — Bracket Predictor</h1>
          <p className="sub">
            Pick a winner in every match. Your picks flow into the next round and
            save automatically.
          </p>
        </div>
        <div className="actions">
          <span className="progress">
            {pickedCount}/{MATCHES.length} picked
          </span>
          <button className="reset" onClick={reset} disabled={pickedCount === 0}>
            Reset
          </button>
        </div>
      </header>

      {championId && (
        <div className={`champion-banner ${complete ? 'final' : ''}`}>
          <span className="trophy">🏆</span>
          <span className="champ-flag">{TEAMS[championId].flag}</span>
          <span className="champ-name">{TEAMS[championId].name}</span>
          <span className="champ-tag">
            {complete ? 'your champion' : 'projected champion'}
          </span>
        </div>
      )}

      <div className="bracket">
        {ROUNDS.map((round) => (
          <section className="round" key={round.id}>
            <h2 className="round-title">{round.label}</h2>
            <div className="round-matches">
              {matchesByRound[round.id].map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  picks={picks}
                  onPick={pick}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function MatchCard({
  match,
  picks,
  onPick,
}: {
  match: Match
  picks: Picks
  onPick: (matchId: number, teamId: string | undefined) => void
}) {
  const { a, b } = teamsForMatch(match, picks)
  const winnerId = picks[match.id]

  return (
    <div className="match">
      <div className="match-meta">
        <span className="match-no">Match {match.id}</span>
        <span className="match-date">{match.date}</span>
      </div>
      <TeamRow
        teamId={a}
        emptyLabel={slotLabel(match.a)}
        selected={winnerId === a && a !== undefined}
        onSelect={() => onPick(match.id, a)}
      />
      <TeamRow
        teamId={b}
        emptyLabel={slotLabel(match.b)}
        selected={winnerId === b && b !== undefined}
        onSelect={() => onPick(match.id, b)}
      />
      {match.venue && <div className="venue">📍 {match.venue}</div>}
    </div>
  )
}

function TeamRow({
  teamId,
  emptyLabel,
  selected,
  onSelect,
}: {
  teamId: string | undefined
  emptyLabel: string
  selected: boolean
  onSelect: () => void
}) {
  const team = teamId ? TEAMS[teamId] : undefined
  const disabled = !team

  return (
    <button
      className={`team ${selected ? 'selected' : ''} ${disabled ? 'empty' : ''}`}
      onClick={onSelect}
      disabled={disabled}
      type="button"
    >
      {team ? (
        <>
          <span className="flag">{team.flag}</span>
          <span className="name">{team.name}</span>
          {selected && <span className="check">✓</span>}
        </>
      ) : (
        <span className="name placeholder">{emptyLabel}</span>
      )}
    </button>
  )
}
