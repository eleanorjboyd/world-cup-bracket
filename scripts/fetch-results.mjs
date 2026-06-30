// Fetches 2026 World Cup knockout results from ESPN's public scoreboard API and
// writes them to public/results.json, keyed by our official match numbers.
//
// No API key required. Run: `node scripts/fetch-results.mjs`
// The scheduled GitHub Action runs this and commits the file when it changes.

import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ESPN =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

// The 32 knockout teams, by code. ESPN abbreviations match these FIFA codes.
const CODES = new Set([
  'RSA', 'CAN', 'BRA', 'JPN', 'GER', 'PAR', 'NED', 'MAR', 'CIV', 'NOR',
  'FRA', 'SWE', 'MEX', 'ECU', 'ENG', 'COD', 'USA', 'BIH', 'BEL', 'SEN',
  'ESP', 'AUT', 'POR', 'CRO', 'SUI', 'ALG', 'AUS', 'EGY', 'ARG', 'CPV',
  'COL', 'GHA',
])

// Fallback name -> code, in case an ESPN abbreviation ever differs.
const NAME2CODE = {
  'south africa': 'RSA', canada: 'CAN', brazil: 'BRA', japan: 'JPN',
  germany: 'GER', paraguay: 'PAR', netherlands: 'NED', morocco: 'MAR',
  'ivory coast': 'CIV', 'côte d’ivoire': 'CIV', norway: 'NOR', france: 'FRA',
  sweden: 'SWE', mexico: 'MEX', ecuador: 'ECU', england: 'ENG',
  'dr congo': 'COD', 'congo dr': 'COD', 'united states': 'USA',
  'bosnia and herzegovina': 'BIH', belgium: 'BEL', senegal: 'SEN',
  spain: 'ESP', austria: 'AUT', portugal: 'POR', croatia: 'CRO',
  switzerland: 'SUI', algeria: 'ALG', australia: 'AUS', egypt: 'EGY',
  argentina: 'ARG', 'cape verde': 'CPV', colombia: 'COL', ghana: 'GHA',
}

// Bracket feeders — mirrors src/bracket.ts. team(code) or winnerOf(matchId).
const T = (c) => ({ team: c })
const W = (id) => ({ win: id })
const MATCHES = [
  { id: 73, a: T('RSA'), b: T('CAN') }, { id: 74, a: T('GER'), b: T('PAR') },
  { id: 75, a: T('NED'), b: T('MAR') }, { id: 76, a: T('BRA'), b: T('JPN') },
  { id: 77, a: T('FRA'), b: T('SWE') }, { id: 78, a: T('CIV'), b: T('NOR') },
  { id: 79, a: T('MEX'), b: T('ECU') }, { id: 80, a: T('ENG'), b: T('COD') },
  { id: 81, a: T('USA'), b: T('BIH') }, { id: 82, a: T('BEL'), b: T('SEN') },
  { id: 83, a: T('POR'), b: T('CRO') }, { id: 84, a: T('ESP'), b: T('AUT') },
  { id: 85, a: T('SUI'), b: T('ALG') }, { id: 86, a: T('ARG'), b: T('CPV') },
  { id: 87, a: T('COL'), b: T('GHA') }, { id: 88, a: T('AUS'), b: T('EGY') },
  { id: 89, a: W(74), b: W(77) }, { id: 90, a: W(73), b: W(75) },
  { id: 91, a: W(76), b: W(78) }, { id: 92, a: W(79), b: W(80) },
  { id: 93, a: W(83), b: W(84) }, { id: 94, a: W(81), b: W(82) },
  { id: 95, a: W(86), b: W(88) }, { id: 96, a: W(85), b: W(87) },
  { id: 97, a: W(89), b: W(90) }, { id: 98, a: W(93), b: W(94) },
  { id: 99, a: W(91), b: W(92) }, { id: 100, a: W(95), b: W(96) },
  { id: 101, a: W(97), b: W(98) }, { id: 102, a: W(99), b: W(100) },
  { id: 104, a: W(101), b: W(102) },
]
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
