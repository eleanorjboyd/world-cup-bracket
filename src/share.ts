import { prune, type Picks } from './picks'

// Public URL where the app is hosted (GitHub Pages). Share links and QR codes
// point here so they work on any phone, even when generated from localhost.
export const APP_URL = 'https://eleanorjboyd.github.io/world-cup-bracket/'

// Encode picks as a compact, URL-safe string.
export function encodePicks(picks: Picks): string {
  const json = JSON.stringify(picks)
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function decodePicks(encoded: string): Picks {
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(escape(atob(b64)))
    const raw = JSON.parse(json) as Record<string, string>
    // Normalise string keys back to numbers and drop anything inconsistent.
    const picks: Picks = {}
    for (const [k, v] of Object.entries(raw)) {
      const id = Number(k)
      if (!Number.isNaN(id) && typeof v === 'string') picks[id] = v
    }
    return prune(picks)
  } catch {
    return {}
  }
}

export function buildShareUrl(picks: Picks): string {
  return `${APP_URL}#b=${encodePicks(picks)}`
}

// Read picks from the current URL hash (e.g. #b=...), if present.
export function picksFromHash(): Picks | null {
  const match = window.location.hash.match(/b=([^&]+)/)
  if (!match) return null
  const picks = decodePicks(match[1])
  return Object.keys(picks).length ? picks : null
}
