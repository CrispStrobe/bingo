import { useEffect, useRef, useState } from 'react'
import {
  FREE,
  LETTERS,
  SIZE,
  type Pattern,
  type Player,
  distanceToBingo,
  pendingCount,
  winningCells,
} from '../game'
import { useI18n } from '../i18n'

type Props = {
  player: Player
  called: Set<number>
  pattern: Pattern
  isWinner: boolean
  frozen: boolean
  canRemove: boolean
  compact: boolean
  onDaub: (cellIndex: number) => 'hit' | 'miss' | 'noop'
  onRename: (name: string) => void
  onRemove: () => void
}

export function BingoCard({
  player,
  called,
  pattern,
  isWinner,
  frozen,
  canRemove,
  compact,
  onDaub,
  onRename,
  onRemove,
}: Props) {
  const { t } = useI18n()
  const [shake, setShake] = useState<number | null>(null)
  const [pop, setPop] = useState<number | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const won = isWinner ? winningCells(player.grid, pattern, player.won) : null
  const ready = pendingCount(player.grid, called)
  const away = distanceToBingo(player.grid, pattern)

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
      className={`card ${isWinner ? 'card--winner' : ''} ${frozen ? 'card--frozen' : ''} ${
        compact ? 'card--compact' : ''
      }`}
      style={{ ['--accent' as string]: player.accent }}
    >
      <header className="card__head">
        <input
          className="card__name"
          value={player.name}
          maxLength={14}
          spellCheck={false}
          aria-label={t('player.name', { n: player.id + 1 })}
          onChange={(e) => onRename(e.target.value)}
        />
        <div className="card__stats">
          <span className="chip chip--wins" title={t('player.wins')}>
            🏆 {player.wins}
          </span>
          <span className="chip" title={t('player.misses')}>
            ✗ {player.misses}
          </span>
          {canRemove && (
            <button
              className="chip chip--remove"
              onClick={onRemove}
              title={t('player.remove', { name: player.name })}
              aria-label={t('player.remove', { name: player.name })}
            >
              ×
            </button>
          )}
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
          const isWin = won?.has(i) ?? false
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
              onClick={() => handle(i)}
              disabled={frozen || free}
              aria-label={free ? t('player.free') : `${LETTERS[i % SIZE]} ${cell.value}`}
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
          <span className="card__status card__status--win">{t('player.bingo')}</span>
        ) : ready > 0 ? (
          <span className="card__status card__status--ready">
            {t('player.ready', { n: ready })}
            {away === 1 ? ` · ${t('player.oneAway')}` : ''}
          </span>
        ) : (
          <span className="card__status">
            {away === 1 ? t('player.oneAway') : t('player.toGo', { n: away })}
          </span>
        )}
      </footer>
    </section>
  )
}
