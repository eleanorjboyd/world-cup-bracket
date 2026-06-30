import { prune, type Picks } from './picks'

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
  const url = new URL(window.location.href)
  url.hash = 'b=' + encodePicks(picks)
  return url.toString()
}

// Read picks from the current URL hash (e.g. #b=...), if present.
export function picksFromHash(): Picks | null {
  const match = window.location.hash.match(/b=([^&]+)/)
  if (!match) return null
  const picks = decodePicks(match[1])
  return Object.keys(picks).length ? picks : null
}
