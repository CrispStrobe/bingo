import { useI18n } from '../i18n'
import { AUTHOR, LICENSE_URL, NOTICES_URL, SOURCE_URL, THIRD_PARTY, openExternal } from '../links'

declare const __APP_VERSION__: string

export function AboutDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()

  const link = (url: string, label: string) => (
    <a
      href={url}
      onClick={(e) => {
        e.preventDefault()
        void openExternal(url)
      }}
    >
      {label}
    </a>
  )

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={t('about.title')} onClick={onClose}>
      <div className="modal__box about" onClick={(e) => e.stopPropagation()}>
        <img className="about__icon" src="icons/icon-192.png" alt="" width={72} height={72} />
        <h2 className="about__title">{t('about.title')}</h2>
        <p className="about__version">{t('about.version', { version: __APP_VERSION__ })}</p>
        <p className="about__lead">{t('about.description')}</p>

        <dl className="about__list">
          <dt>{t('about.author')}</dt>
          <dd>{AUTHOR}</dd>

          <dt>{t('about.license')}</dt>
          <dd>
            {t('about.licenseBody')} {link(LICENSE_URL, 'AGPL-3.0')}
          </dd>

          <dt>{t('about.source')}</dt>
          <dd>{link(SOURCE_URL, 'github.com/CrispStrobe/bingo')}</dd>

          <dt>{t('about.privacy')}</dt>
          <dd>{t('about.privacyBody')}</dd>

          <dt>{t('about.thirdParty')}</dt>
          <dd>
            <ul className="about__deps">
              {THIRD_PARTY.map((d) => (
                <li key={d.name}>
                  {link(d.url, d.name)} — {d.license}
                  {d.copyright && <span className="about__copy">{d.copyright}</span>}
                </li>
              ))}
            </ul>
            {link(NOTICES_URL, t('about.thirdParty'))}
          </dd>
        </dl>

        <div className="modal__actions">
          <button className="btn btn--call" onClick={onClose}>
            {t('about.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
