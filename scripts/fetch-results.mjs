// Fetches 2026 World Cup knockout results from ESPN's public scoreboard API and
// writes them to public/results.json, keyed by our official match numbers.
//
// No API key required. Run: `node scripts/fetch-results.mjs`
// The scheduled GitHub Action runs this and commits the file when it changes.

import { writeFile, mkdir } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ESPN =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

// Single source of truth — the same bracket data the app uses.
const data = JSON.parse(
  readFileSync(new URL('../src/data/bracket.json', import.meta.url), 'utf8'),
)

// The 32 knockout teams by code (ESPN abbreviations match these FIFA codes).
const CODES = new Set(Object.keys(data.teams))

// Fallback team-name -> code, derived from the data plus a few ESPN name
// variants, in case an ESPN abbreviation ever differs.
const NAME2CODE = { 'côte d’ivoire': 'CIV', 'congo dr': 'COD' }
for (const [code, [name]] of Object.entries(data.teams)) {
  NAME2CODE[name.toLowerCase()] = code
}

// Bracket feeders come straight from the shared data ({ team } or { win }).
const MATCHES = data.matches
const BY_ID = Object.fromEntries(MATCHES.map((m) => [m.id, m]))

function codeOf(competitor) {
  const abbr = competitor.team?.abbreviation?.toUpperCase()
  if (abbr && CODES.has(abbr)) return abbr
  const name = competitor.team?.displayName?.toLowerCase()
  return (name && NAME2CODE[name]) || null
}

function dateRange(startISO, endISO) {
  const out = []
  for (let d = new Date(startISO); d <= new Date(endISO); d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(
      `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(
        d.getUTCDate(),
      ).padStart(2, '0')}`,
    )
  }
  return out
}

async function fetchCompletedEvents() {
  const events = []
  for (const date of dateRange('2026-06-28', '2026-07-19')) {
    let json
    try {
      const res = await fetch(`${ESPN}?dates=${date}`)
      if (!res.ok) continue
      json = await res.json()
    } catch {
      continue
    }
    for (const ev of json.events ?? []) {
      const comp = ev.competitions?.[0]
      const st = comp?.status?.type
      if (!comp || !st?.completed) continue
      const byCode = {}
      let winner = null
      let ok = true
      for (const c of comp.competitors) {
        const code = codeOf(c)
        if (!code) { ok = false; break }
        byCode[code] = { score: c.score ?? '0', so: c.shootoutScore, won: !!c.winner }
        if (c.winner) winner = code
      }
      if (!ok || !winner) continue
      const pens = /pen/i.test(st.shortDetail || st.detail || '')
      events.push({ codes: new Set(Object.keys(byCode)), byCode, winner, pens })
    }
  }
  return events
}

function findEvent(events, aCode, bCode) {
  return events.find(
    (e) => e.codes.size === 2 && e.codes.has(aCode) && e.codes.has(bCode),
  )
}

function buildResults(events) {
  const results = {}
  const resolveSlot = (slot) => (slot.team ? slot.team : results[slot.win]?.winner)

  let changed = true
  while (changed) {
    changed = false
    for (const m of MATCHES) {
      if (results[m.id]) continue
      const aCode = resolveSlot(m.a)
      const bCode = resolveSlot(m.b)
      if (!aCode || !bCode) continue
      const ev = findEvent(events, aCode, bCode)
      if (!ev) continue
      const a = ev.byCode[aCode]
      const b = ev.byCode[bCode]
      let score = `${a.score}–${b.score}`
      if (ev.pens && a.so != null && b.so != null) score += ` (${a.so}–${b.so} pens)`
      results[m.id] = { winner: ev.winner, score }
      changed = true
    }
  }
  return results
}

async function main() {
  const events = await fetchCompletedEvents()
  const results = buildResults(events)

  const here = dirname(fileURLToPath(import.meta.url))
  const outDir = join(here, '..', 'public')
  await mkdir(outDir, { recursive: true })
  const outFile = join(outDir, 'results.json')
  await writeFile(outFile, JSON.stringify(results, null, 2) + '\n')

  const ids = Object.keys(results).map(Number).sort((x, y) => x - y)
  console.log(`Wrote ${ids.length} completed matches:`, ids.join(', '))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
