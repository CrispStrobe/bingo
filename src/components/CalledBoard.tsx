import { LETTERS, maxBall, type Variant } from '../game'

export function CalledBoard({
  called,
  current,
  label,
  variant,
}: {
  called: Set<number>
  current: number | null
  label: string
  variant: Variant
}) {
  if (variant !== '75') return (
    <div className={`board board--90 ${variant === 'tombola' ? 'board--tombola' : ''}`} aria-label={label}>
      <div className="board__nums">
        {Array.from({ length: maxBall(variant) }, (_, i) => i + 1).map((n) => (
          <span key={n} className={`board__num ${called.has(n) ? 'is-called' : ''} ${n === current ? 'is-current' : ''}`}>{n}</span>
        ))}
      </div>
    </div>
  )
  return (
    <div className="board" aria-label={label}>
      {LETTERS.map((letter, row) => (
        <div className="board__row" key={letter}>
          <span className="board__letter">{letter}</span>
          <div className="board__nums">
            {Array.from({ length: 15 }, (_, i) => row * 15 + i + 1).map((n) => (
              <span
                key={n}
                className={`board__num ${called.has(n) ? 'is-called' : ''} ${n === current ? 'is-current' : ''}`}
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
