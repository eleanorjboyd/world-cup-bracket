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
import QRCode from 'qrcode'
import {
  MATCHES,
  RESULTS,
  ROUNDS,
  ROUND_LABEL,
  TEAMS,
  bracketSide,
  matchesInBracketOrder,
  type Match,
  type MatchResult,
  type RoundId,
  type Slot,
} from './bracket'
import {
  applyResults,
  champion,
  isComplete,
  setPick,
  teamsForMatch,
  type Picks,
} from './picks'
import { buildShareUrl, picksFromHash } from './share'
import { fetchLive, flagFor, type LiveMatch } from './live'

const STORAGE_KEY = 'wc2026-bracket-picks-v1'

function loadPicks(): Picks {
  const shared = picksFromHash()
  if (shared) return applyResults(shared, RESULTS)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return applyResults(raw ? (JSON.parse(raw) as Picks) : {}, RESULTS)
  } catch {
    return applyResults({}, RESULTS)
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
  const [results, setResults] = useState<Record<number, MatchResult>>(RESULTS)
  const [shareOpen, setShareOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const isMobile = useIsMobile()
  const live = useLive()
  const liveGames = live.filter((m) => m.state === 'in')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(picks))
  }, [picks])

  // Pull live results (written by the scheduled ESPN job) and lock them in.
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}results.json`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Record<string, MatchResult> | null) => {
        if (!data) return
        const merged: Record<number, MatchResult> = { ...RESULTS }
        for (const [id, r] of Object.entries(data)) {
          if (r && typeof r.winner === 'string') merged[Number(id)] = r
        }
        setResults(merged)
        setPicks((prev) => applyResults(prev, merged))
      })
      .catch(() => {})
  }, [])

  const pick = useCallback(
    (matchId: number, teamId: string | undefined) => {
      if (!teamId || results[matchId]) return
      setPicks((prev) => applyResults(setPick(prev, matchId, teamId), results))
    },
    [results],
  )

  const championId = champion(picks)
  const complete = isComplete(picks)
  const pickedCount = Object.keys(picks).length
  const lockedCount = Object.keys(results).length

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
            className={`sched-btn ${liveGames.length ? 'has-live' : ''}`}
            onClick={() => setScheduleOpen(true)}
          >
            {liveGames.length > 0 && <span className="live-dot" />}
            📅 Schedule
          </button>
          <button
            className={`share-btn ${complete ? 'ready' : ''}`}
            onClick={() => setShareOpen(true)}
            disabled={pickedCount === 0}
          >
            {complete ? '🎉 Share' : 'Share'}
          </button>
          <button
            className="reset"
            onClick={() => setPicks(applyResults({}, results))}
            disabled={pickedCount <= lockedCount}
          >
            Reset
          </button>
        </div>
      </header>

      {liveGames.length > 0 && (
        <LiveBanner games={liveGames} onOpen={() => setScheduleOpen(true)} />
      )}

      {scheduleOpen && (
        <ScheduleModal matches={live} onClose={() => setScheduleOpen(false)} />
      )}

      {shareOpen && (
        <ShareModal
          picks={picks}
          results={results}
          championId={championId}
          complete={complete}
          onClose={() => setShareOpen(false)}
        />
      )}

      {isMobile ? (
        <StepperView
          picks={picks}
          results={results}
          onPick={pick}
          championId={championId}
          complete={complete}
        />
      ) : (
        <WallView
          picks={picks}
          results={results}
          onPick={pick}
          championId={championId}
          complete={complete}
        />
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

// Polls ESPN for live + upcoming matches and refreshes every 60s.
function useLive(intervalMs = 60000) {
  const [matches, setMatches] = useState<LiveMatch[]>([])
  useEffect(() => {
    let active = true
    const tick = () =>
      fetchLive()
        .then((m) => {
          if (active) setMatches(m)
        })
        .catch(() => {})
    tick()
    const id = setInterval(tick, intervalMs)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [intervalMs])
  return matches
}

interface ViewProps {
  picks: Picks
  results: Record<number, MatchResult>
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

function Wall({ picks, results, onPick, championId, complete }: ViewProps) {
  return (
    <div className="wall">
      {LEFT_ROUNDS.map((r) => (
        <RoundColumn key={`L-${r}`} round={r} side="left" picks={picks} results={results} onPick={onPick} />
      ))}

      <section className="col final" style={{ width: COL_WIDTH.F }}>
        <h2 className="col-title">Final</h2>
        <div className="col-body" style={{ justifyContent: 'center' }}>
          {matchesInBracketOrder('F').map((m) => (
            <div className="cell" key={m.id}>
              <MatchCard match={m} picks={picks} results={results} onPick={onPick} />
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
        <RoundColumn key={`R-${r}`} round={r} side="right" picks={picks} results={results} onPick={onPick} />
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
  results,
  onPick,
}: {
  round: RoundId
  side: 'left' | 'right'
  picks: Picks
  results: Record<number, MatchResult>
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
            <MatchCard match={m} picks={picks} results={results} onPick={onPick} />
          </div>
        ))}
      </div>
    </section>
  )
}

function MatchCard({
  match,
  picks,
  results,
  onPick,
}: {
  match: Match
  picks: Picks
  results: Record<number, MatchResult>
  onPick: (matchId: number, teamId: string | undefined) => void
}) {
  const { a, b } = teamsForMatch(match, picks)
  const winnerId = picks[match.id]
  const result = results[match.id]
  const final = !!result

  return (
    <div className={`match ${final ? 'is-final' : ''}`}>
      <div className="match-meta">
        <span>Match {match.id}</span>
        <span>{final ? '🔒 FINAL' : match.date}</span>
      </div>
      <TeamRow
        teamId={a}
        emptyLabel={slotLabel(match.a)}
        selected={a !== undefined && winnerId === a}
        locked={final}
        onSelect={() => onPick(match.id, a)}
      />
      <TeamRow
        teamId={b}
        emptyLabel={slotLabel(match.b)}
        selected={b !== undefined && winnerId === b}
        locked={final}
        onSelect={() => onPick(match.id, b)}
      />
      {final && result && <div className="match-score">{result.score}</div>}
    </div>
  )
}

function TeamRow({
  teamId,
  emptyLabel,
  selected,
  locked = false,
  onSelect,
}: {
  teamId: string | undefined
  emptyLabel: string
  selected: boolean
  locked?: boolean
  onSelect: () => void
}) {
  const team = teamId ? TEAMS[teamId] : undefined
  const lost = locked && !!team && !selected

  return (
    <button
      className={`team ${selected ? 'selected' : ''} ${team ? '' : 'empty'} ${
        locked ? 'locked' : ''
      } ${lost ? 'lost' : ''}`}
      onClick={locked ? undefined : onSelect}
      disabled={!team || locked}
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

function StepperView({ picks, results, onPick, championId, complete }: ViewProps) {
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
            <StepMatch key={m.id} match={m} picks={picks} results={results} onPick={onPick} />
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
  results,
  onPick,
}: {
  match: Match
  picks: Picks
  results: Record<number, MatchResult>
  onPick: (matchId: number, teamId: string | undefined) => void
}) {
  const { a, b } = teamsForMatch(match, picks)
  const winnerId = picks[match.id]
  const result = results[match.id]
  const final = !!result
  return (
    <div className={`step-match ${final ? 'is-final' : ''}`}>
      <div className="sm-meta">
        <span>Match {match.id}</span>
        <span>{final ? `🔒 FINAL · ${result?.score ?? ''}` : match.date}</span>
      </div>
      <div className="sm-vs">
        <StepOption
          teamId={a}
          placeholder={slotLabel(match.a)}
          selected={a !== undefined && winnerId === a}
          locked={final}
          onSelect={() => onPick(match.id, a)}
        />
        <span className="sm-mid">vs</span>
        <StepOption
          teamId={b}
          placeholder={slotLabel(match.b)}
          selected={b !== undefined && winnerId === b}
          locked={final}
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
  locked = false,
  onSelect,
}: {
  teamId: string | undefined
  placeholder: string
  selected: boolean
  locked?: boolean
  onSelect: () => void
}) {
  const team = teamId ? TEAMS[teamId] : undefined
  const lost = locked && !!team && !selected
  return (
    <button
      className={`sm-opt ${selected ? 'sel' : ''} ${locked ? 'locked' : ''} ${
        lost ? 'lost' : ''
      }`}
      disabled={!team || locked}
      onClick={locked ? undefined : onSelect}
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
  results,
  championId,
  complete,
  onClose,
}: {
  picks: Picks
  results: Record<number, MatchResult>
  championId: string | undefined
  complete: boolean
  onClose: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ scale: 1, h: 0 })
  const [busy, setBusy] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [qr, setQr] = useState<string>('')

  const shareUrl = buildShareUrl(picks)

  useEffect(() => {
    let active = true
    QRCode.toDataURL(shareUrl, {
      width: 240,
      margin: 1,
      color: { dark: '#0a3315ff', light: '#fffef6ff' },
    })
      .then((url) => {
        if (active) setQr(url)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [shareUrl])

  useLayoutEffect(() => {
    const pv = previewRef.current
    const card = cardRef.current
    if (!pv || !card) return
    const scale = Math.min(1, pv.clientWidth / card.offsetWidth)
    setBox({ scale, h: card.offsetHeight * scale })
  }, [qr])

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
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 1800)
    } catch {
      /* clipboard may be blocked; ignore */
    }
  }, [shareUrl])

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
              results={results}
              championId={championId}
              complete={complete}
              qr={qr}
            />
          </div>
        </div>

        <div className="share-qr">
          {qr && <img src={qr} alt="QR code linking to this bracket" width={120} height={120} />}
          <div className="share-qr-text">
            <strong>Scan to open on your phone</strong>
            <span>Anyone who scans this gets your exact bracket to try.</span>
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
  {
    picks: Picks
    results: Record<number, MatchResult>
    championId: string | undefined
    complete: boolean
    qr: string
  }
>(function ShareCard({ picks, results, championId, complete, qr }, ref) {
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
      <Wall picks={picks} results={results} onPick={noop} championId={championId} complete={complete} />
      <div className="sc-footer">
        {qr && <img className="sc-qr" src={qr} alt="" width={84} height={84} />}
        <span className="sc-footer-text">Scan to fill out your own bracket</span>
      </div>
    </div>
  )
})

function noop() {}

// ---------- Live banner + schedule ----------

function scoreLine(m: LiveMatch) {
  return `${flagFor(m.aCode)} ${m.aName} ${m.aScore}–${m.bScore} ${m.bName} ${flagFor(
    m.bCode,
  )}`
}

function LiveBanner({
  games,
  onOpen,
}: {
  games: LiveMatch[]
  onOpen: () => void
}) {
  return (
    <button className="live-banner" onClick={onOpen} type="button">
      <span className="live-dot big" />
      <span className="live-label">LIVE</span>
      <span className="live-games">
        {games.slice(0, 2).map((m) => (
          <span className="live-game" key={m.id}>
            {scoreLine(m)} <em>{m.detail}</em>
          </span>
        ))}
        {games.length > 2 && <span className="live-more">+{games.length - 2} more</span>}
      </span>
    </button>
  )
}

function ScheduleModal({
  matches,
  onClose,
}: {
  matches: LiveMatch[]
  onClose: () => void
}) {
  // Group by local calendar day.
  const groups: { label: string; items: LiveMatch[] }[] = []
  for (const m of matches) {
    const d = new Date(m.kickoff)
    const label = d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    let g = groups.find((x) => x.label === label)
    if (!g) {
      g = { label, items: [] }
      groups.push(g)
    }
    g.items.push(m)
  }

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="schedule-panel">
        <div className="share-panel-top">
          <h2>📅 Knockout schedule</h2>
          <button className="close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {groups.length === 0 && (
          <p className="sched-empty">No matches in the current window.</p>
        )}

        {groups.map((g) => (
          <div className="sched-day" key={g.label}>
            <div className="sched-day-label">{g.label}</div>
            {g.items.map((m) => (
              <ScheduleRow key={m.id} m={m} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function ScheduleRow({ m }: { m: LiveMatch }) {
  const time = new Date(m.kickoff).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  const live = m.state === 'in'
  const done = m.state === 'post'

  return (
    <div className={`sched-row ${live ? 'live' : ''}`}>
      <span className="sched-team">
        <span className={`st-name ${m.winner === 'a' ? 'won' : ''}`}>
          {flagFor(m.aCode)} {m.aName}
        </span>
        <span className={`st-name ${m.winner === 'b' ? 'won' : ''}`}>
          {flagFor(m.bCode)} {m.bName}
        </span>
      </span>
      <span className="sched-status">
        {live && (
          <>
            <span className="live-dot" /> {m.aScore}–{m.bScore}
            <em>{m.detail}</em>
          </>
        )}
        {done && (
          <>
            <strong>
              {m.aScore}–{m.bScore}
            </strong>
            <em>{m.detail}</em>
          </>
        )}
        {!live && !done && <span className="sched-time">{time}</span>}
      </span>
    </div>
  )
}

