import { TEAMS } from './bracket'

// Client-side poller for ESPN's public World Cup scoreboard. ESPN sends
// `access-control-allow-origin: *`, so we can call it straight from the browser
// for near-real-time schedule + live scores (no API key, no backend).

const ESPN =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

export type MatchState = 'pre' | 'in' | 'post'

export interface LiveMatch {
  id: string
  aName: string
  bName: string
  aCode: string | null
  bCode: string | null
  aScore: string
  bScore: string
  state: MatchState
  completed: boolean
  detail: string // e.g. "67'", "HT", "FT", "FT-Pens"
  kickoff: string // ISO datetime
  winner: 'a' | 'b' | null
}

function ymd(d: Date): string {
  return (
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0')
  )
}

function codeOf(competitor: any): string | null {
  const abbr = competitor?.team?.abbreviation?.toUpperCase()
  return abbr && TEAMS[abbr] ? abbr : null
}

// Fetch a window of days around today so we cover live games + the next few
// fixtures for the schedule. Knockout matches are spread ~daily.
export async function fetchLive(): Promise<LiveMatch[]> {
  const today = new Date()
  const dates: string[] = []
  for (let off = -1; off <= 4; off++) {
    const d = new Date(today)
    d.setDate(d.getDate() + off)
    dates.push(ymd(d))
  }

  const all: LiveMatch[] = []
  await Promise.all(
    dates.map(async (date) => {
      try {
        const res = await fetch(`${ESPN}?dates=${date}`)
        if (!res.ok) return
        const json = await res.json()
        for (const ev of json.events ?? []) {
          const c = ev.competitions?.[0]
          if (!c) continue
          const st = c.status?.type ?? {}
          const home = c.competitors?.find((x: any) => x.homeAway === 'home')
          const away = c.competitors?.find((x: any) => x.homeAway === 'away')
          if (!home || !away) continue
          all.push({
            id: String(ev.id),
            aName:
              home.team?.shortDisplayName || home.team?.displayName || 'TBD',
            bName:
              away.team?.shortDisplayName || away.team?.displayName || 'TBD',
            aCode: codeOf(home),
            bCode: codeOf(away),
            aScore: String(home.score ?? '0'),
            bScore: String(away.score ?? '0'),
            state: (st.state as MatchState) ?? 'pre',
            completed: !!st.completed,
            detail: st.shortDetail || st.detail || '',
            kickoff: ev.date,
            winner: home.winner ? 'a' : away.winner ? 'b' : null,
          })
        }
      } catch {
        /* ignore a single failed day */
      }
    }),
  )

  const byId = new Map(all.map((m) => [m.id, m]))
  return [...byId.values()].sort((x, y) => (x.kickoff < y.kickoff ? -1 : 1))
}

export function flagFor(code: string | null): string {
  return code && TEAMS[code] ? TEAMS[code].flag : '⚽'
}
