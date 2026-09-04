import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Ball, EmptyBall } from './components/Ball'
import { BingoCard } from './components/BingoCard'
import { CalledBoard } from './components/CalledBoard'
import { Confetti } from './components/Confetti'
import {
  ACCENTS,
  DEFAULT_NAMES,
  FREE,
  MAX_BALL,
  type Player,
  completedLines,
  letterFor,
  makeGrid,
  makePlayers,
  newBag,
} from './game'
import { isApplePortable, useInstallPrompt } from './pwa'
import { sfx } from './sound'

type State = {
  round: number
  players: Player[]
  bag: number[]
  drawn: number[]
  winners: number[]
  autoDraw: boolean
  autoDaub: boolean
  speed: number
  muted: boolean
  modalOpen: boolean
}

type Action =
  | { type: 'draw' }
  | { type: 'daub'; player: number; cell: number }
  | { type: 'miss'; player: number }
  | { type: 'rename'; player: number; name: string }
  | { type: 'newRound' }
  | { type: 'resetScores' }
  | { type: 'toggle'; key: 'autoDraw' | 'autoDaub' | 'muted' }
  | { type: 'speed'; value: number }
  | { type: 'closeModal' }

const STORE_KEY = 'bingo-party:v1'

type Saved = { names: string[]; wins: number[]; muted: boolean; speed: number; autoDaub: boolean }

function loadSaved(): Saved {
  const fallback: Saved = { names: DEFAULT_NAMES, wins: [0, 0, 0], muted: false, speed: 3500, autoDaub: false }
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<Saved>
    return {
      names: Array.isArray(parsed.names) && parsed.names.length === 3 ? parsed.names : fallback.names,
      wins: Array.isArray(parsed.wins) && parsed.wins.length === 3 ? parsed.wins : fallback.wins,
      muted: typeof parsed.muted === 'boolean' ? parsed.muted : fallback.muted,
      speed: typeof parsed.speed === 'number' ? parsed.speed : fallback.speed,
      autoDaub: typeof parsed.autoDaub === 'boolean' ? parsed.autoDaub : fallback.autoDaub,
    }
  } catch {
    return fallback
  }
}

function init(): State {
  const saved = loadSaved()
  return {
    round: 1,
    players: makePlayers(saved.names, saved.wins),
    bag: newBag(),
    drawn: [],
    winners: [],
    autoDraw: false,
    autoDaub: saved.autoDaub,
    speed: saved.speed,
    muted: saved.muted,
    modalOpen: false,
  }
}

/** Award the round to every player who just completed a line. */
function settle(state: State, players: Player[]): State {
  const winners: number[] = []
  const scored = players.map((p) => {
    const lines = completedLines(p.grid)
    if (lines.length) {
      winners.push(p.id)
      return { ...p, lines, wins: p.wins + 1 }
    }
    return p
  })
  if (!winners.length) return { ...state, players }
  return { ...state, players: scored, winners, autoDraw: false, modalOpen: true }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'draw': {
      if (state.winners.length || !state.bag.length) return state
      const bag = state.bag.slice(0, -1)
      const ball = state.bag[state.bag.length - 1]
      const drawn = [...state.drawn, ball]
      const next = { ...state, bag, drawn, autoDraw: bag.length ? state.autoDraw : false }
      if (!state.autoDaub) return next
      const players = next.players.map((p) => ({
        ...p,
        grid: p.grid.map((c) => (c.value === ball ? { ...c, marked: true } : c)),
      }))
      return settle(next, players)
    }

    case 'daub': {
      if (state.winners.length) return state
      const players = state.players.map((p) =>
        p.id === action.player
          ? { ...p, grid: p.grid.map((c, i) => (i === action.cell ? { ...c, marked: true } : c)) }
          : p,
      )
      return settle(state, players)
    }

    case 'miss':
      return {
        ...state,
        players: state.players.map((p) => (p.id === action.player ? { ...p, misses: p.misses + 1 } : p)),
      }

    case 'rename':
      return {
        ...state,
        players: state.players.map((p) => (p.id === action.player ? { ...p, name: action.name } : p)),
      }

    case 'newRound':
      return {
        ...state,
        round: state.round + 1,
        players: state.players.map((p) => ({ ...p, grid: makeGrid(), misses: 0, lines: [] })),
        bag: newBag(),
        drawn: [],
        winners: [],
        autoDraw: false,
        modalOpen: false,
      }

    case 'resetScores':
      return {
        ...init(),
        players: makePlayers(
          state.players.map((p) => p.name),
          [0, 0, 0],
        ),
        muted: state.muted,
        speed: state.speed,
        autoDaub: state.autoDaub,
      }

    case 'toggle':
      return { ...state, [action.key]: !state[action.key] }

    case 'speed':
      return { ...state, speed: action.value }

    case 'closeModal':
      return { ...state, modalOpen: false }
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, init)
  const { players, drawn, bag, winners, autoDraw, autoDaub, speed, muted, modalOpen } = state
  const [showHelp, setShowHelp] = useState(false)
  const { canInstall, install } = useInstallPrompt()

  const called = useMemo(() => new Set(drawn), [drawn])
  const current = drawn.length ? drawn[drawn.length - 1] : null
  const over = winners.length > 0
  const bagEmpty = bag.length === 0

  // ---- persistence -------------------------------------------------------
  useEffect(() => {
    const saved: Saved = {
      names: players.map((p) => p.name),
      wins: players.map((p) => p.wins),
      muted,
      speed,
      autoDaub,
    }
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(saved))
    } catch {
      /* private mode — settings just won't stick */
    }
  }, [players, muted, speed, autoDaub])

  // ---- sound (refs keep StrictMode's double-invoke from double-playing) ---
  const lastSounded = useRef(0)
  useEffect(() => {
    if (current === null || drawn.length === lastSounded.current) return
    lastSounded.current = drawn.length
    if (!muted) sfx.draw(current)
  }, [drawn.length, current, muted])

  const wonRef = useRef(false)
  useEffect(() => {
    if (over && !wonRef.current) {
      wonRef.current = true
      if (!muted) sfx.win()
    }
    if (!over) wonRef.current = false
  }, [over, muted])

  // ---- auto draw ---------------------------------------------------------
  useEffect(() => {
    if (!autoDraw || over || bagEmpty) return
    const id = window.setInterval(() => dispatch({ type: 'draw' }), speed)
    return () => window.clearInterval(id)
  }, [autoDraw, over, bagEmpty, speed])

  const draw = useCallback(() => {
    sfx.unlock()
    dispatch({ type: 'draw' })
  }, [])

  // ---- space bar draws ---------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.isContentEditable)) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (!over && !bagEmpty) draw()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [draw, over, bagEmpty])

  const daub = useCallback(
    (pid: number, cell: number): 'hit' | 'miss' | 'noop' => {
      if (over) return 'noop'
      const c = players[pid].grid[cell]
      if (c.marked || c.value === FREE) return 'noop'
      if (!called.has(c.value)) {
        if (!muted) sfx.miss()
        dispatch({ type: 'miss', player: pid })
        return 'miss'
      }
      if (!muted) sfx.daub()
      dispatch({ type: 'daub', player: pid, cell })
      return 'hit'
    },
    [called, muted, over, players],
  )

  const recent = drawn.slice(-6, -1).reverse()
  const winnerNames = winners.map((id) => players[id].name)

  return (
    <div className="app">
      <div className="app__glow" aria-hidden />

      <header className="topbar">
        <div className="brand">
          <span className="brand__balls" aria-hidden>
            <i style={{ ['--b' as string]: '#3b82f6' }}>B</i>
            <i style={{ ['--b' as string]: '#ef4444' }}>I</i>
            <i style={{ ['--b' as string]: '#22c55e' }}>N</i>
            <i style={{ ['--b' as string]: '#f59e0b' }}>G</i>
            <i style={{ ['--b' as string]: '#a855f7' }}>O</i>
          </span>
          <span className="brand__sub">Round {state.round} · 3-player hot seat</span>
        </div>

        <div className="topbar__actions">
          <label className="switch">
            <input
              type="checkbox"
              checked={autoDraw}
              disabled={over || bagEmpty}
              onChange={() => {
                sfx.unlock()
                dispatch({ type: 'toggle', key: 'autoDraw' })
              }}
            />
            <span>Auto-call</span>
          </label>
          <select
            className="select"
            value={speed}
            aria-label="Auto-call speed"
            onChange={(e) => dispatch({ type: 'speed', value: Number(e.target.value) })}
          >
            <option value={5000}>Slow</option>
            <option value={3500}>Normal</option>
            <option value={2000}>Fast</option>
            <option value={1200}>Frantic</option>
          </select>
          <label className="switch">
            <input type="checkbox" checked={autoDaub} onChange={() => dispatch({ type: 'toggle', key: 'autoDaub' })} />
            <span>Auto-daub</span>
          </label>
          <button className="btn btn--ghost" onClick={() => dispatch({ type: 'toggle', key: 'muted' })}>
            {muted ? '🔇' : '🔊'}
          </button>
          <button className="btn btn--ghost" onClick={() => setShowHelp((v) => !v)} aria-expanded={showHelp}>
            ?
          </button>
          {canInstall && (
            <button className="btn btn--install" onClick={install}>
              ⤓ Install
            </button>
          )}
          <button className="btn" onClick={() => dispatch({ type: 'newRound' })}>
            New round
          </button>
        </div>
      </header>

      {showHelp && (
        <div className="help">
          <p>
            <b>Call a ball</b> with the big button (or the space bar). Every player then daubs that number on their own
            card — tap it. Tapping a number that has <i>not</i> been called counts as a miss.
          </p>
          <p>
            First card with five in a row — across, down or diagonally, the ★ centre is free — wins the round. Names and
            trophies are remembered on this device.
          </p>
          <p className="help__install">
            {isApplePortable()
              ? 'Keep it on the iPad: Share → Add to Home Screen. It then opens full screen and plays with no internet at all.'
              : 'Install it from your browser menu (or the Install button) to play full screen and offline.'}
          </p>
        </div>
      )}

      <main className="stage">
        <aside className="caller-col">
          <div className="caller">
            <div className="caller__ball">
              {current === null ? <EmptyBall /> : <Ball n={current} spin={drawn.length} />}
            </div>

            <p className="caller__say">
              {over
                ? `${winnerNames.join(' & ')} ${winnerNames.length > 1 ? 'have' : 'has'} bingo!`
                : current === null
                  ? 'Press call to start'
                  : `${letterFor(current)} — ${current}`}
            </p>

            <button className="btn btn--call" onClick={draw} disabled={over || bagEmpty}>
              {bagEmpty ? 'Bag empty' : over ? 'Round over' : 'Call ball'}
              <small>{MAX_BALL - drawn.length} left</small>
            </button>

            <div className="recent" aria-label="Previous calls">
              {recent.length === 0 && <span className="recent__none">no calls yet</span>}
              {recent.map((n) => (
                <Ball key={n} n={n} size="sm" />
              ))}
            </div>

          </div>

          <div className="board-panel">
            <CalledBoard called={called} current={current} />
          </div>
        </aside>

        <div className="cards">
          {players.map((p) => (
            <BingoCard
              key={p.id}
              player={p}
              called={called}
              isWinner={winners.includes(p.id)}
              frozen={over}
              onDaub={(cell) => daub(p.id, cell)}
              onRename={(name) => dispatch({ type: 'rename', player: p.id, name })}
            />
          ))}
        </div>
      </main>

      <footer className="footer">
        <button className="btn btn--ghost btn--tiny" onClick={() => dispatch({ type: 'resetScores' })}>
          Reset trophies
        </button>
        <span>Space = call · click your numbers to daub</span>
      </footer>

      <Confetti active={over} colors={[...ACCENTS, '#ffffff', '#8b5cf6']} />

      {over && modalOpen && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal__box" style={{ ['--accent' as string]: players[winners[0]].accent }}>
            <span className="modal__kicker">Round {state.round}</span>
            <h2 className="modal__title">BINGO!</h2>
            <p className="modal__who">{winnerNames.join(' & ')}</p>
            <p className="modal__detail">
              won on ball {drawn.length} ({letterFor(current ?? 1)}-{current}) · {players[winners[0]].misses} misses
            </p>
            <div className="modal__scores">
              {players.map((p) => (
                <span key={p.id} style={{ ['--accent' as string]: p.accent }}>
                  <b>{p.name}</b> 🏆 {p.wins}
                </span>
              ))}
            </div>
            <div className="modal__actions">
              <button className="btn btn--call" onClick={() => dispatch({ type: 'newRound' })}>
                Next round
              </button>
              <button className="btn btn--ghost" onClick={() => dispatch({ type: 'closeModal' })}>
                Look at the cards
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
