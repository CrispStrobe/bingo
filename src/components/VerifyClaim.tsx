import { useEffect, useRef, useState } from 'react'
import { verifyTicketClaim, type GameState } from '../game'
import { useI18n } from '../i18n'

export function VerifyClaim({ state, onClose }: { state: GameState; onClose: () => void }) {
  const { t } = useI18n()
  const [code, setCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const result = code ? verifyTicketClaim(code, state.drawn, state.pattern, state.players.flatMap((player) => player.tickets)) : null

  useEffect(() => {
    if (!scanning || !video.current) return
    if (!navigator.mediaDevices?.getUserMedia) { setCameraError(true); setScanning(false); return }
    let stream: MediaStream | undefined
    let frame = 0
    let alive = true
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })
    Promise.all([
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }),
      import('jsqr').then((module) => module.default),
    ]).then(([media, jsQR]) => {
      if (!alive || !video.current) { media.getTracks().forEach((track) => track.stop()); return }
      stream = media; video.current.srcObject = media; void video.current.play()
      const scan = () => {
        if (!alive || !video.current) return
        const width = video.current.videoWidth
        const height = video.current.videoHeight
        if (context && width && height) {
          canvas.width = width; canvas.height = height
          context.drawImage(video.current, 0, 0, width, height)
          const pixels = context.getImageData(0, 0, width, height)
          const found = jsQR(pixels.data, width, height, { inversionAttempts: 'dontInvert' })
          if (found?.data) { setCode(found.data); setScanning(false); return }
        }
        frame = requestAnimationFrame(scan)
      }
      frame = requestAnimationFrame(scan)
    }).catch(() => { setCameraError(true); setScanning(false) })
    return () => { alive = false; cancelAnimationFrame(frame); stream?.getTracks().forEach((track) => track.stop()) }
  }, [scanning])

  return <div className="modal" role="dialog" aria-modal="true" aria-labelledby="verify-title">
    <div className="modal__box verify">
      <h2 id="verify-title" className="lan__title">{t('verify.title')}</h2>
      <p className="lan__body">{t('verify.body')}</p>
      {scanning && <video ref={video} className="verify__video" muted playsInline />}
      <textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('verify.placeholder')} aria-label={t('verify.placeholder')} />
      {result && <p className={`verify__result verify__result--${result.reason}`}>{t(`verify.${result.reason}` as import('../locales/en').Key)}</p>}
      {cameraError && <p className="lan__note">{t('verify.cameraError')}</p>}
      <div className="modal__actions">
        <button className="btn btn--call" onClick={() => { setCameraError(false); setScanning((value) => !value) }}>{scanning ? t('verify.stop') : t('verify.scan')}</button>
        <button className="btn btn--ghost" onClick={onClose}>{t('about.close')}</button>
      </div>
    </div>
  </div>
}
