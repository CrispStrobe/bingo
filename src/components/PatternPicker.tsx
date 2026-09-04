import { PATTERNS, PATTERN_PREVIEW, SIZE, type Pattern } from '../game'
import { useI18n } from '../i18n'
import type { Key } from '../locales/en'

export function PatternPicker({ value, onChange }: { value: Pattern; onChange: (p: Pattern) => void }) {
  const { t } = useI18n()
  return (
    <div className="patterns" role="radiogroup" aria-label={t('ctl.pattern')}>
      {PATTERNS.map((p) => {
        const cells = new Set(PATTERN_PREVIEW[p])
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
              {Array.from({ length: SIZE * SIZE }, (_, i) => (
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
