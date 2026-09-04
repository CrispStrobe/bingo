import { useCallback, useEffect, useRef, useState } from 'react'
import type { Action, GameState } from './game'
import { type Wire, couldBeClient, probeHost, wsUrl } from './lan'

export type ClientPhase = 'probing' | 'none' | 'joining' | 'seated' | 'lost'

const SEAT_KEY = 'bingo-party:seat'

/**
 * The joined-device half of LAN play. Renders whatever the host sends and asks
 * the host to do things; never runs the rules itself.
 */
export function useLanClient() {
  const [phase, setPhase] = useState<ClientPhase>(() => (couldBeClient() ? 'probing' : 'none'))
  const [state, setState] = useState<GameState | null>(null)
  const [claimed, setClaimed] = useState<number[]>([])
  const [seat, setSeat] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const ws = useRef<WebSocket | null>(null)
  const seatRef = useRef<number | null>(null)
  const wanted = useRef<{ seat?: number; name?: string } | null>(null)
  const retry = useRef<number | undefined>(undefined)

  const send = useCallback((msg: Wire) => {
    if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify(msg))
  }, [])

  useEffect(() => {
    if (!couldBeClient()) return
    let closed = false

    const connect = () => {
      let socket: WebSocket
      try {
        socket = new WebSocket(wsUrl())
      } catch {
        setPhase('none')
        return
      }
      ws.current = socket

      socket.onopen = () => {
        setPhase('joining')
        // re-take the same seat after a reload or a dropped connection
        const remembered = wanted.current ?? readSeat()
        if (remembered) send({ t: 'claim', ...remembered })
      }

      socket.onmessage = (e) => {
        let msg: Wire
        try {
          msg = JSON.parse(String(e.data)) as Wire
        } catch {
          return
        }
        if (msg.t === 'welcome' || msg.t === 'state') {
          setState(msg.state)
          setClaimed(msg.claimed)
          if (msg.t === 'welcome' && typeof msg.seat === 'number') {
            seatRef.current = msg.seat
            setSeat(msg.seat)
            setPhase('seated')
          }
        } else if (msg.t === 'seat') {
          seatRef.current = msg.seat
          setSeat(msg.seat)
          setPhase('seated')
          setNotice(null)
          writeSeat({ seat: msg.seat })
        } else if (msg.t === 'denied') {
          setNotice(msg.reason)
          wanted.current = null
        }
      }

      socket.onclose = () => {
        if (closed) return
        setPhase('lost')
        retry.current = window.setTimeout(connect, 2000)
      }

      socket.onerror = () => socket.close()
    }

    // ask first: an ordinary web page must not open a socket that cannot work
    probeHost().then((isHost) => {
      if (closed) return
      if (!isHost) {
        setPhase('none')
        return
      }
      connect()
    })

    return () => {
      closed = true
      window.clearTimeout(retry.current)
      ws.current?.close()
    }
  }, [send])

  const claim = useCallback(
    (opts: { seat?: number; name?: string }) => {
      wanted.current = opts
      writeSeat(opts)
      send({ t: 'claim', ...opts })
    },
    [send],
  )

  const act = useCallback(
    (action: Action) => {
      send({ t: 'action', action })
    },
    [send],
  )

  const leave = useCallback(() => {
    seatRef.current = null
    wanted.current = null
    setSeat(null)
    setPhase('joining')
    clearSeat()
    ws.current?.close()
  }, [])

  return { phase, state, seat, claimed, notice, claim, act, leave } as const
}

function readSeat(): { seat?: number; name?: string } | null {
  try {
    const raw = sessionStorage.getItem(SEAT_KEY)
    return raw ? (JSON.parse(raw) as { seat?: number; name?: string }) : null
  } catch {
    return null
  }
}

function writeSeat(v: { seat?: number; name?: string }) {
  try {
    sessionStorage.setItem(SEAT_KEY, JSON.stringify(v))
  } catch {
    /* private mode */
  }
}

function clearSeat() {
  try {
    sessionStorage.removeItem(SEAT_KEY)
  } catch {
    /* private mode */
  }
}
