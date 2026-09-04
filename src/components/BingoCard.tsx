import { useEffect, useRef, useState } from 'react'
import { FREE, LETTERS, LINES, SIZE, type Player, distanceToBingo, pendingCount } from '../game'

type Props = {
  player: Player
  called: Set<number>
  isWinner: boolean
  frozen: boolean
  onDaub: (cellIndex: number) => 'hit' | 'miss' | 'noop'
  onRename: (name: string) => void
}

export function BingoCard({ player, called, isWinner, frozen, onDaub, onRename }: Props) {
  const [shake, setShake] = useState<number | null>(null)
  const [pop, setPop] = useState<number | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const winningCells = new Set<number>()
  if (player.lines.length) player.lines.forEach((l) => LINES[l].forEach((i) => winningCells.add(i)))

  const ready = pendingCount(player.grid, called)
  const away = distanceToBingo(player.grid)

  function handle(i: number) {
    if (frozen) return
    const result = onDaub(i)
    if (result === 'hit') {
      setPop(i)
      timers.current.push(window.setTimeout(() => setPop(null), 400))
    } else if (result === 'miss') {
      setShake(i)
      timers.current.push(window.setTimeout(() => setShake(null), 420))
    }
  }

  return (
    <section
      className={`card ${isWinner ? 'card--winner' : ''} ${frozen ? 'card--frozen' : ''}`}
      style={{ ['--accent' as string]: player.accent }}
    >
      <header className="card__head">
        <input
          className="card__name"
          value={player.name}
          maxLength={14}
          spellCheck={false}
          aria-label={`Name of player ${player.id + 1}`}
          onChange={(e) => onRename(e.target.value)}
        />
        <div className="card__stats">
          <span className="chip chip--wins" title="Rounds won">🏆 {player.wins}</span>
          <span className="chip" title="Wrong daubs this round">✗ {player.misses}</span>
        </div>
      </header>

      <div className="card__letters">
        {LETTERS.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>

      <div className="card__grid" role="grid">
        {player.grid.map((cell, i) => {
          const free = cell.value === FREE
          const isWin = isWinner && winningCells.has(i)
          return (
            <button
              key={i}
              role="gridcell"
              className={[
                'cell',
                cell.marked ? 'is-marked' : '',
                free ? 'is-free' : '',
                isWin ? 'is-win' : '',
                shake === i ? 'is-shake' : '',
                pop === i ? 'is-pop' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ ['--d' as string]: `${(i % SIZE) * 25 + Math.floor(i / SIZE) * 25}ms` }}
              onClick={() => handle(i)}
              disabled={frozen || free}
              aria-label={free ? 'Free space' : `${LETTERS[i % SIZE]} ${cell.value}`}
              aria-pressed={cell.marked}
            >
              <span className="cell__value">{free ? '★' : cell.value}</span>
              <span className="cell__daub" aria-hidden />
            </button>
          )
        })}
      </div>

      <footer className="card__foot">
        {isWinner ? (
          <span className="card__status card__status--win">BINGO!</span>
        ) : ready > 0 ? (
          <span className="card__status card__status--ready">
            {ready} to daub{away === 1 ? ' · 1 away!' : ''}
          </span>
        ) : (
          <span className="card__status">{away === 1 ? '1 away from bingo' : `${away} to go`}</span>
        )}
      </footer>
    </section>
  )
}
