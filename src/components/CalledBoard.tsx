import { LETTERS, MAX_BALL } from '../game'

export function CalledBoard({
  called,
  current,
  label,
}: {
  called: Set<number>
  current: number | null
  label: string
}) {
  return (
    <div className="board" aria-label={label}>
      {LETTERS.map((letter, row) => (
        <div className="board__row" key={letter}>
          <span className="board__letter">{letter}</span>
          <div className="board__nums">
            {Array.from({ length: MAX_BALL / 5 }, (_, i) => row * 15 + i + 1).map((n) => (
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
