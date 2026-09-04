import { useEffect, useRef, useState } from 'react'
import {
  BLANK,
  FREE,
  LETTERS,
  type Pattern,
  type Player,
  type Ticket,
  type Variant,
  dimensions,
  distanceToBingo,
  pendingCount,
  winningCells,
} from '../game'
import { useI18n } from '../i18n'

type Props = {
  player: Player
  ticket: Ticket
  variant: Variant
  showLetters: boolean
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
  ticket,
  variant,
  showLetters,
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

  const ticketWin = player.won.find((win) => win.ticket === ticket.id)
  const won = ticketWin ? winningCells(ticket.grid, pattern, ticketWin.targets, variant) : null
  const ready = pendingCount(ticket.grid, called)
  const away = distanceToBingo(ticket.grid, pattern, variant)
  const { cols } = dimensions(variant)

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
      className={`card ${isWinner && ticketWin ? 'card--winner' : ''} ${frozen ? 'card--frozen' : ''} ${
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
        {player.tickets.length > 1 && <span className="chip">{t('player.ticket', { n: ticket.id + 1 })}</span>}
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

      {variant === '75' && showLetters && <div className="card__letters">
        {LETTERS.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>}

      <div className={`card__grid card__grid--${variant}`} role="grid">
        {ticket.grid.map((cell, i) => {
          const free = cell.value === FREE
          const blank = cell.value === BLANK
          const isWin = won?.has(i) ?? false
          return (
            <button
              key={i}
              role="gridcell"
              className={[
                'cell',
                cell.marked ? 'is-marked' : '',
                free ? 'is-free' : '', blank ? 'is-blank' : '',
                isWin ? 'is-win' : '',
                shake === i ? 'is-shake' : '',
                pop === i ? 'is-pop' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handle(i)}
              disabled={frozen || free || blank}
              aria-label={blank ? undefined : free ? t('player.free') : `${variant === '75' ? LETTERS[i % cols] : ''} ${cell.value}`}
              aria-pressed={cell.marked}
            >
              <span className="cell__value">{blank ? '' : free ? '★' : cell.value}</span>
              <span className="cell__daub" aria-hidden />
            </button>
          )
        })}
      </div>

      <footer className="card__foot">
        {isWinner && ticketWin ? (
          <span className="card__status card__status--win">{variant === 'tombola' ? t('player.prize', { prize: t(`pattern.${pattern}` as import('../locales/en').Key) }) : t('player.bingo')}</span>
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
