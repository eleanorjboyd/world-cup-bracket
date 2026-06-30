import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { toPng } from 'html-to-image'
import {
  MATCHES,
  ROUNDS,
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
import { buildShareUrl, picksFromHash } from './share'

const STORAGE_KEY = 'wc2026-bracket-picks-v1'

function loadPicks(): Picks {
  const shared = picksFromHash()
  if (shared) return shared
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

const SHORT_LABEL: Record<RoundId, string> = {
  R32: 'R32',
  R16: 'R16',
  QF: 'QF',
  SF: 'SF',
  F: 'Final',
}

export default function App() {
  const [picks, setPicks] = useState<Picks>(loadPicks)
  const [shareOpen, setShareOpen] = useState(false)
  const isMobile = useIsMobile()

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
    <div className={`app ${isMobile ? 'is-mobile' : 'is-desktop'}`}>
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
            className={`share-btn ${complete ? 'ready' : ''}`}
            onClick={() => setShareOpen(true)}
            disabled={pickedCount === 0}
          >
            {complete ? '🎉 Share' : 'Share'}
          </button>
          <button
            className="reset"
            onClick={() => setPicks({})}
            disabled={pickedCount === 0}
          >
            Reset
          </button>
        </div>
      </header>

      {shareOpen && (
        <ShareModal
          picks={picks}
          championId={championId}
          complete={complete}
          onClose={() => setShareOpen(false)}
        />
      )}

      {isMobile ? (
        <StepperView picks={picks} onPick={pick} championId={championId} complete={complete} />
      ) : (
        <WallView picks={picks} onPick={pick} championId={championId} complete={complete} />
      )}
    </div>
  )
}

function useIsMobile() {
  const query = '(max-width: 760px)'
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

interface ViewProps {
  picks: Picks
  onPick: (matchId: number, teamId: string | undefined) => void
  championId: string | undefined
  complete: boolean
}

function WallView(props: ViewProps) {
  return (
    <FitStage>
      <Wall {...props} />
    </FitStage>
  )
}

function Wall({ picks, onPick, championId, complete }: ViewProps) {
  return (
    <div className="wall">
      {LEFT_ROUNDS.map((r) => (
        <RoundColumn key={`L-${r}`} round={r} side="left" picks={picks} onPick={onPick} />
      ))}

      <section className="col final" style={{ width: COL_WIDTH.F }}>
        <h2 className="col-title">Final</h2>
        <div className="col-body" style={{ justifyContent: 'center' }}>
          {matchesInBracketOrder('F').map((m) => (
            <div className="cell" key={m.id}>
              <MatchCard match={m} picks={picks} onPick={onPick} />
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
        <RoundColumn key={`R-${r}`} round={r} side="right" picks={picks} onPick={onPick} />
      ))}
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

// ---------- Mobile: focus stepper (one round at a time) ----------

function firstIncompleteRound(picks: Picks): number {
  const ids = ROUNDS.map((r) => r.id)
  for (let i = 0; i < ids.length; i++) {
    if (matchesInBracketOrder(ids[i]).some((m) => picks[m.id] == null)) return i
  }
  return ids.length - 1
}

function StepperView({ picks, onPick, championId, complete }: ViewProps) {
  const roundIds = ROUNDS.map((r) => r.id)
  const [step, setStep] = useState(() => firstIncompleteRound(picks))
  const roundId = roundIds[step]
  const matches = matchesInBracketOrder(roundId)
  const done = matches.filter((m) => picks[m.id] != null).length

  return (
    <div className="stepper">
      <div className="step-head">
        <div className="step-round">{ROUND_LABEL[roundId]}</div>
        <div className="step-desc">
          {roundId === 'F'
            ? 'Pick your champion'
            : `Tap the winners — ${done}/${matches.length}`}
        </div>
      </div>

      <div className="step-tabs">
        {roundIds.map((r, i) => {
          const rc = matchesInBracketOrder(r).every((m) => picks[m.id] != null)
          return (
            <button
              key={r}
              className={`step-tab ${i === step ? 'active' : ''} ${rc ? 'done' : ''}`}
              onClick={() => setStep(i)}
              type="button"
            >
              {SHORT_LABEL[r]}
              {rc ? ' ✓' : ''}
            </button>
          )
        })}
      </div>

      <div className="step-body">
        {roundId === 'F' && championId ? (
          <div className="champ-card">
            <div className="trophy">🏆</div>
            <div className="cflag">{TEAMS[championId].flag}</div>
            <div className="cname">{TEAMS[championId].name}</div>
            <div className="ctag">
              {complete ? 'your champion' : 'projected champion'}
            </div>
          </div>
        ) : (
          matches.map((m) => (
            <StepMatch key={m.id} match={m} picks={picks} onPick={onPick} />
          ))
        )}
      </div>

      <div className="step-nav">
        <button
          className="snav"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          type="button"
        >
          ← Back
        </button>
        <button
          className="snav primary"
          disabled={step === roundIds.length - 1}
          onClick={() => setStep((s) => Math.min(roundIds.length - 1, s + 1))}
          type="button"
        >
          Next →
        </button>
      </div>
    </div>
  )
}

function StepMatch({
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
    <div className="step-match">
      <div className="sm-meta">
        <span>Match {match.id}</span>
        <span>{match.date}</span>
      </div>
      <div className="sm-vs">
        <StepOption
          teamId={a}
          placeholder={slotLabel(match.a)}
          selected={a !== undefined && winnerId === a}
          onSelect={() => onPick(match.id, a)}
        />
        <span className="sm-mid">vs</span>
        <StepOption
          teamId={b}
          placeholder={slotLabel(match.b)}
          selected={b !== undefined && winnerId === b}
          onSelect={() => onPick(match.id, b)}
        />
      </div>
      {match.venue && <div className="sm-venue">📍 {match.venue}</div>}
    </div>
  )
}

function StepOption({
  teamId,
  placeholder,
  selected,
  onSelect,
}: {
  teamId: string | undefined
  placeholder: string
  selected: boolean
  onSelect: () => void
}) {
  const team = teamId ? TEAMS[teamId] : undefined
  return (
    <button
      className={`sm-opt ${selected ? 'sel' : ''}`}
      disabled={!team}
      onClick={onSelect}
      type="button"
    >
      {team ? (
        <>
          <span className="sm-flag">{team.flag}</span>
          <span className="sm-name">{team.name}</span>
        </>
      ) : (
        <span className="sm-name ph">{placeholder}</span>
      )}
    </button>
  )
}

// ---------- Share ----------

function ShareModal({
  picks,
  championId,
  complete,
  onClose,
}: {
  picks: Picks
  championId: string | undefined
  complete: boolean
  onClose: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ scale: 1, h: 0 })
  const [busy, setBusy] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  useLayoutEffect(() => {
    const pv = previewRef.current
    const card = cardRef.current
    if (!pv || !card) return
    const scale = Math.min(1, pv.clientWidth / card.offsetWidth)
    setBox({ scale, h: card.offsetHeight * scale })
  }, [])

  const download = useCallback(async () => {
    if (!cardRef.current) return
    setBusy(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#2c9139',
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'my-world-cup-2026-bracket.png'
      a.click()
    } finally {
      setBusy(false)
    }
  }, [])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildShareUrl(picks))
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 1800)
    } catch {
      /* clipboard may be blocked; ignore */
    }
  }, [picks])

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="share-panel">
        <div className="share-panel-top">
          <h2>{complete ? 'Your bracket is set! 🏆' : 'Share your bracket'}</h2>
          <button className="close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="share-preview" ref={previewRef} style={{ height: box.h || undefined }}>
          <div className="share-scaler" style={{ transform: `scale(${box.scale})` }}>
            <ShareCard
              ref={cardRef}
              picks={picks}
              championId={championId}
              complete={complete}
            />
          </div>
        </div>

        <div className="share-actions">
          <button className="snav primary" onClick={download} disabled={busy} type="button">
            {busy ? 'Rendering…' : '⬇ Download image'}
          </button>
          <button className="snav" onClick={copyLink} type="button">
            {linkCopied ? 'Link copied! ✓' : '🔗 Copy share link'}
          </button>
        </div>
      </div>
    </div>
  )
}

const ShareCard = forwardRef<
  HTMLDivElement,
  { picks: Picks; championId: string | undefined; complete: boolean }
>(function ShareCard({ picks, championId, complete }, ref) {
  return (
    <div className="share-card" ref={ref}>
      <div className="share-card-head">
        <span className="sc-title">⚽ My World Cup 2026 Bracket</span>
        {championId && (
          <span className="sc-champ">
            🏆 {TEAMS[championId].flag} {TEAMS[championId].name}
          </span>
        )}
      </div>
      <Wall picks={picks} onPick={noop} championId={championId} complete={complete} />
    </div>
  )
})

function noop() {}

