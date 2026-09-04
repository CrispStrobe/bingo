import { patternsFor, type Pattern, type Variant } from '../game'
import { useI18n } from '../i18n'
import type { Key } from '../locales/en'

export function PatternPicker({ value, variant, onChange }: { value: Pattern; variant: Variant; onChange: (p: Pattern) => void }) {
  const { t } = useI18n()
  return (
    <div className="patterns" role="radiogroup" aria-label={t('ctl.pattern')}>
      {patternsFor(variant).map((p) => {
        const preview: Record<Pattern, number[]> = {
          line: [10, 11, 12, 13, 14], corners: [0, 4, 20, 24], x: [0, 4, 6, 8, 12, 16, 18, 20, 24], blackout: Array.from({ length: 25 }, (_, i) => i),
          oneLine: [9, 10, 11, 12, 13], twoLines: [0, 1, 2, 3, 4, 18, 19, 20, 21, 22], fullHouse: Array.from({ length: 15 }, (_, i) => i),
        }
        const cells = new Set(preview[p])
        return (
          <button
            key={p}
            role="radio"
            aria-checked={value === p}
            className={`pattern ${value === p ? 'is-active' : ''}`}
            onClick={() => onChange(p)}
            title={t(`pattern.${p}.hint` as Key)}
          >
            <span className="pattern__mini" aria-hidden>
              {Array.from({ length: variant === '75' ? 25 : 15 }, (_, i) => (
                <i key={i} className={cells.has(i) ? 'on' : ''} />
              ))}
            </span>
            <span className="pattern__name">{t(`pattern.${p}` as Key)}</span>
          </button>
        )
      })}
    </div>
  )
}
