import { smorfiaFor, smorfiaIconUrl } from '../smorfia'

export function SmorfiaCall({ number, compact = false }: { number: number; compact?: boolean }) {
  const call = smorfiaFor(number)
  if (!call) return null
  return (
    <span className={`smorfia ${compact ? 'smorfia--compact' : ''}`} lang="nap">
      <img src={smorfiaIconUrl(call.icon)} alt="" />
      {!compact && <span>{call.label}</span>}
    </span>
  )
}
