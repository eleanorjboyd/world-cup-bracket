import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  MATCHES,
  ROUND_LABEL,
  TEAMS,
  bracketSide,
  matchesInBracketOrder,
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
  return slot.kind === 'winner' ? `Winner ${slot.matchId}` : 'TBD'
}

// Column widths per round (px), kept compact so the whole chart fits one screen.
const COL_WIDTH: Record<RoundId, number> = {
  R32: 158,
  R16: 150,
  QF: 142,
  SF: 134,
  F: 170,
}

const DECOR = [
  { e: '⚽', left: '4%', top: '18%', d: '0s' },
  { e: '🥅', left: '12%', top: '74%', d: '.6s' },
  { e: '⚽', left: '90%', top: '22%', d: '1.1s' },
  { e: '🎉', left: '84%', top: '80%', d: '.3s' },
  { e: '🧤', left: '48%', top: '8%', d: '.9s' },
  { e: '🚩', left: '30%', top: '92%', d: '1.4s' },
]

const LEFT_ROUNDS: RoundId[] = ['R32', 'R16', 'QF', 'SF']
const RIGHT_ROUNDS: RoundId[] = ['SF', 'QF', 'R16', 'R32']

export default function App() {
  const [picks, setPicks] = useState<Picks>(loadPicks)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(picks))
  }, [picks])

  const pick = useCallback((matchId: number, teamId: string | undefined) => {
    if (!teamId) return
    setPicks((prev) => setPick(prev, matchId, teamId))
  }, [])

  const championId = champion(picks)
  const complete = isComplete(picks)
  const pickedCount = Object.keys(picks).length

  return (
    <div className="app">
      <div className="decor" aria-hidden>
        {DECOR.map((d, i) => (
          <span key={i} style={{ left: d.left, top: d.top, animationDelay: d.d }}>
            {d.e}
          </span>
        ))}
      </div>

      <header className="topbar">
        <h1>World Cup 2026 — Pick&apos;em</h1>
        <div className="actions">
          <span className="progress">
            {pickedCount}/{MATCHES.length} picked
          </span>
          <button
            className="reset"
            onClick={() => setPicks({})}
            disabled={pickedCount === 0}
          >
            Reset
          </button>
        </div>
      </header>

      <FitStage>
        <div className="wall">
          {LEFT_ROUNDS.map((r) => (
            <RoundColumn key={`L-${r}`} round={r} side="left" picks={picks} onPick={pick} />
          ))}

          <section className="col final" style={{ width: COL_WIDTH.F }}>
            <h2 className="col-title">Final</h2>
            <div className="col-body" style={{ justifyContent: 'center' }}>
              {matchesInBracketOrder('F').map((m) => (
                <div className="cell" key={m.id}>
                  <MatchCard match={m} picks={picks} onPick={pick} />
                </div>
              ))}
            </div>
            <div className="champ">
              {championId ? (
                <>
                  {complete ? 'Champion' : 'Projected champion'}
                  <span className="big">{TEAMS[championId].name}</span>
                </>
              ) : (
                '\u00a0'
              )}
            </div>
          </section>

          {RIGHT_ROUNDS.map((r) => (
            <RoundColumn key={`R-${r}`} round={r} side="right" picks={picks} onPick={pick} />
          ))}
        </div>
      </FitStage>
    </div>
  )
}

// Scales its child down so the whole bracket fits the available space.
function FitStage({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const wallRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const fit = useCallback(() => {
    const stage = stageRef.current
    const wall = wallRef.current
    if (!stage || !wall) return
    const sx = (stage.clientWidth - 8) / wall.offsetWidth
    const sy = (stage.clientHeight - 8) / wall.offsetHeight
    setScale(Math.min(1, sx, sy))
  }, [])

  useLayoutEffect(() => {
    fit()
  })

  useEffect(() => {
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [fit])

  return (
    <div className="stage" ref={stageRef}>
      <div className="wall-fit" ref={wallRef} style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}

function RoundColumn({
  round,
  side,
  picks,
  onPick,
}: {
  round: RoundId
  side: 'left' | 'right'
  picks: Picks
  onPick: (matchId: number, teamId: string | undefined) => void
}) {
  const matches = matchesInBracketOrder(round).filter(
    (m) => bracketSide(m.id) === side,
  )
  const classes = ['col', side === 'left' ? 'side-left' : 'side-right', 'connect']
  if (matches.length > 1) classes.push('pairs')

  return (
    <section className={classes.join(' ')} style={{ width: COL_WIDTH[round] }}>
      <h2 className="col-title">{ROUND_LABEL[round]}</h2>
      <div className="col-body">
        {matches.map((m) => (
          <div className="cell" key={m.id}>
            <MatchCard match={m} picks={picks} onPick={onPick} />
          </div>
        ))}
      </div>
    </section>
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
        <span>Match {match.id}</span>
        <span>{match.date}</span>
      </div>
      <TeamRow
        teamId={a}
        emptyLabel={slotLabel(match.a)}
        selected={a !== undefined && winnerId === a}
        onSelect={() => onPick(match.id, a)}
      />
      <TeamRow
        teamId={b}
        emptyLabel={slotLabel(match.b)}
        selected={b !== undefined && winnerId === b}
        onSelect={() => onPick(match.id, b)}
      />
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

  return (
    <button
      className={`team ${selected ? 'selected' : ''} ${team ? '' : 'empty'}`}
      onClick={onSelect}
      disabled={!team}
      type="button"
    >
      {team ? (
        <>
          <span className="flag">{team.flag}</span>
          <span className="name">{team.name}</span>
        </>
      ) : (
        <span className="name placeholder">{emptyLabel}</span>
      )}
    </button>
  )
}

