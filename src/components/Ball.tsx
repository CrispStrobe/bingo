import { letterFor, type Variant } from '../game'

const HUES: Record<string, string> = {
  B: '#3b82f6',
  I: '#ef4444',
  N: '#22c55e',
  G: '#f59e0b',
  O: '#a855f7',
}

export function Ball({ n, variant = '75', size = 'lg', spin }: { n: number; variant?: Variant; size?: 'lg' | 'sm'; spin?: number }) {
  const letter = letterFor(n, variant)
  return (
    <div
      key={spin}
      className={`ball ball--${size} ${spin !== undefined ? 'ball--drop' : ''}`}
      style={{ ['--ball' as string]: variant === 'tombola' ? '#c2410c' : HUES[letter] }}
    >
      {letter && <span className="ball__letter">{letter}</span>}
      <span className="ball__num">{n}</span>
    </div>
  )
}

export function EmptyBall() {
  return (
    <div className="ball ball--lg ball--empty">
      <span className="ball__num">?</span>
    </div>
  )
}
