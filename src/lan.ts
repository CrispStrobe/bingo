// LAN play. One device runs the native app and hosts; every other device on the
// wireless network joins by opening the host's URL in a browser and gets its own
// card. The host owns the game state — clients send actions and render what
// comes back — so there is exactly one implementation of the rules.

import type { Action, GameState } from './game'

export type Wire =
  // host -> client
  | { t: 'welcome'; seat: number | null; state: GameState; claimed: number[] }
  | { t: 'state'; state: GameState; claimed: number[] }
  | { t: 'seat'; seat: number }
  | { t: 'denied'; reason: string }
  // client -> host
  | { t: 'claim'; seat?: number; name?: string }
  | { t: 'action'; action: Action }

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/** Only a page served BY a host can join one: same origin, plain http. */
export function couldBeClient(): boolean {
  if (typeof window === 'undefined' || isTauri()) return false
  return location.protocol === 'http:' && !location.hostname.endsWith('tauri.localhost')
}

export function wsUrl(): string {
  return `ws://${location.host}/ws`
}

/**
 * Is this page actually served by a LAN host? A plain fetch, because a failed
 * WebSocket handshake logs a console error on every ordinary web server.
 * An SPA fallback answering 200 with index.html is not a host, hence the
 * content check rather than a status check.
 */
export async function probeHost(): Promise<boolean> {
  try {
    const res = await fetch('lan/hello', { cache: 'no-store' })
    if (!res.ok) return false
    const body = (await res.json()) as { bingo?: string }
    return body.bingo === 'host'
  } catch {
    return false
  }
}

/** Actions a joined device may perform; anything else is the host's business. */
export function allowedFromClient(action: unknown, seat: number | null): action is Action {
  if (!action || typeof action !== 'object') return false
  const candidate = action as Partial<Action>
  switch (candidate.type) {
    case 'draw':
      return seat !== null
    case 'daub':
      return seat !== null && candidate.player === seat && Number.isInteger(candidate.ticket) && Number.isInteger(candidate.cell)
    case 'miss':
      return seat !== null && candidate.player === seat
    case 'rename':
      return seat !== null && candidate.player === seat && typeof candidate.name === 'string'
    default:
      return false
  }
}

// --- the Tauri side, imported lazily so the web build never touches it -------

export type LanInfo = { ip: string; port: number; url: string; qr: string }

async function api() {
  const [{ invoke }, { listen }] = await Promise.all([
    import('@tauri-apps/api/core'),
    import('@tauri-apps/api/event'),
  ])
  return { invoke, listen }
}

export async function lanStart(): Promise<LanInfo> {
  const { invoke } = await api()
  return invoke<LanInfo>('lan_start')
}

export async function lanStop(): Promise<void> {
  const { invoke } = await api()
  await invoke('lan_stop')
}

export async function lanStatus(): Promise<LanInfo | null> {
  const { invoke } = await api()
  return invoke<LanInfo | null>('lan_status')
}

export async function lanSend(payload: Wire, conn?: number): Promise<void> {
  const { invoke } = await api()
  await invoke('lan_send', { conn: conn ?? null, payload: JSON.stringify(payload) })
}

export type LanEvents = {
  onOpen: (conn: number) => void
  onMessage: (conn: number, msg: Wire) => void
  onClose: (conn: number) => void
}

/** Subscribe to socket traffic; resolves to an unsubscribe function. */
export async function lanListen(handlers: LanEvents): Promise<() => void> {
  const { listen } = await api()
  const offs = await Promise.all([
    listen<number>('lan://open', (e) => handlers.onOpen(e.payload)),
    listen<{ conn: number; payload: string }>('lan://message', (e) => {
      try {
        handlers.onMessage(e.payload.conn, JSON.parse(e.payload.payload) as Wire)
      } catch {
        /* a malformed frame is not worth crashing the host over */
      }
    }),
    listen<number>('lan://close', (e) => handlers.onClose(e.payload)),
  ])
  return () => offs.forEach((off) => off())
}
