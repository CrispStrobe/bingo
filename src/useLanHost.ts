import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_PLAYERS, type Action, type GameState } from './game'
import { type LanInfo, allowedFromClient, isTauri, lanListen, lanSend, lanStart, lanStatus, lanStop } from './lan'

export type HostState = {
  info: LanInfo | null
  /** conn id -> seat index */
  seats: Record<number, number>
  busy: boolean
  error: string | null
}

/**
 * Runs the LAN host: serves the game to the network and keeps every joined
 * device in sync. The host's own reducer stays authoritative — clients only
 * ever ask, and are told what happened.
 */
export function useLanHost(state: GameState, dispatch: (a: Action) => void, defaultName: (n: number) => string) {
  const [info, setInfo] = useState<LanInfo | null>(null)
  const [seats, setSeats] = useState<Record<number, number>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stateRef = useRef(state)
  stateRef.current = state
  const seatsRef = useRef(seats)
  seatsRef.current = seats
  // seats handed out this tick, before the reducer has caught up
  const pending = useRef(0)

  const start = useCallback(async () => {
    if (!isTauri()) return
    setBusy(true)
    setError(null)
    try {
      setInfo(await lanStart())
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }, [])

  const stop = useCallback(async () => {
    if (!isTauri()) return
    await lanStop().catch(() => {})
    setInfo(null)
    setSeats({})
  }, [])

  const canRemovePlayer = useCallback((player: number) => !Object.values(seatsRef.current).includes(player), [])

  /** Keep connection-to-seat indices correct when the host removes an unclaimed player. */
  const removePlayer = useCallback((player: number) => {
    if (!canRemovePlayer(player)) return
    setSeats((current) => {
      const next: Record<number, number> = {}
      Object.entries(current).forEach(([rawConn, seat]) => {
        const conn = Number(rawConn)
        const shifted = seat > player ? seat - 1 : seat
        next[conn] = shifted
        if (shifted !== seat) void lanSend({ t: 'seat', seat: shifted }, conn)
      })
      return next
    })
    dispatch({ type: 'removePlayer', player })
  }, [canRemovePlayer, dispatch])

  // pick up a server that survived a webview reload
  useEffect(() => {
    if (!isTauri()) return
    lanStatus()
      .then((s) => s && setInfo(s))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!info || !isTauri()) return
    let off: (() => void) | undefined
    let dead = false

    const claimed = () => new Set(Object.values(seatsRef.current))

    lanListen({
      onOpen: (conn) => {
        void lanSend(
          { t: 'welcome', seat: null, state: stateRef.current, claimed: [...claimed()] },
          conn,
        )
      },

      onMessage: (conn, msg) => {
        if (msg.t === 'claim') {
          const taken = claimed()
          const players = stateRef.current.players
          let seat: number | null = null

          const freeExisting = () => {
            for (let i = 0; i < players.length; i++) if (!taken.has(i)) return i
            return null
          }
          const addNew = () => {
            const next = players.length + pending.current
            if (next >= MAX_PLAYERS) return null
            pending.current += 1
            dispatch({ type: 'addPlayer', name: msg.name?.trim() || defaultName(next + 1) })
            return next
          }

          if (typeof msg.seat === 'number' && msg.seat < players.length && !taken.has(msg.seat)) {
            seat = msg.seat // asked for a specific card and it is free
          } else if (msg.name) {
            // "join as a new player" means a new card, not someone else's
            seat = addNew() ?? freeExisting()
          } else {
            // a silent rejoin (reload, dropped wifi) settles for any free card
            seat = freeExisting() ?? addNew()
          }

          if (seat === null) {
            void lanSend({ t: 'denied', reason: 'full' }, conn)
            return
          }

          if (msg.name?.trim() && seat !== null) dispatch({ type: 'rename', player: seat, name: msg.name.trim() })
          setSeats((s) => ({ ...s, [conn]: seat as number }))
          void lanSend({ t: 'seat', seat }, conn)
          return
        }

        if (msg.t === 'action') {
          const seat = seatsRef.current[conn] ?? null
          if (!allowedFromClient(msg.action, seat)) {
            void lanSend({ t: 'denied', reason: 'not allowed' }, conn)
            return
          }
          dispatch(msg.action)
        }
      },

      onClose: (conn) => {
        setSeats((s) => {
          const next = { ...s }
          delete next[conn]
          return next
        })
      },
    })
      .then((fn) => {
        if (dead) fn()
        else off = fn
      })
      .catch((e) => setError(String(e)))

    return () => {
      dead = true
      off?.()
    }
  }, [info, dispatch, defaultName])

  // one broadcast per state change keeps every device honest
  useEffect(() => {
    if (!info || !isTauri()) return
    pending.current = 0
    void lanSend({ t: 'state', state, claimed: [...new Set(Object.values(seats))] })
  }, [state, seats, info])

  return { info, seats, busy, error, start, stop, canRemovePlayer, removePlayer } as const
}
