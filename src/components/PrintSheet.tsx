import { useEffect, useState } from 'react'
import { BLANK, FREE, LETTERS, dimensions, encodeTicketClaim, type GameState, type Ticket } from '../game'
import { useI18n } from '../i18n'

function TicketQr({ ticket, variant }: { ticket: Ticket; variant: GameState['variant'] }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let alive = true
    import('qrcode').then((module) => module.default.toDataURL(
      encodeTicketClaim(ticket, variant),
      { width: 144, margin: 1, errorCorrectionLevel: 'M' },
    ))
      .then((url) => { if (alive) setSrc(url) })
      .catch(() => {})
    return () => { alive = false }
  }, [ticket, variant])
  return src ? <img className="print-ticket__qr" src={src} alt="" /> : null
}

export function PrintSheet({ state }: { state: GameState }) {
  const { t } = useI18n()
  const { cols } = dimensions(state.variant)
  return (
    <section className="print-sheet" aria-hidden="true">
      {state.players.flatMap((player) => player.tickets.map((ticket) => (
        <article className="print-ticket" key={`${player.id}-${ticket.id}`}>
          <header>
            <div><b>CrispBingo</b><span>{player.name} · {t('player.ticket', { n: ticket.id + 1 })}</span></div>
            <span>{t(`pattern.${state.pattern}` as import('../locales/en').Key)}</span>
          </header>
          {state.variant === '75' && state.showLetters && <div className="print-ticket__letters">{LETTERS.map((letter) => <b key={letter}>{letter}</b>)}</div>}
          <div className={`print-ticket__grid print-ticket__grid--${state.variant}`}>
            {ticket.grid.map((cell, i) => <span key={i} className={cell.value === BLANK ? 'is-blank' : ''}>{cell.value === FREE ? '★' : cell.value === BLANK ? '' : cell.value}</span>)}
          </div>
          <footer><TicketQr ticket={ticket} variant={state.variant} /><span>{t('verify.scanHint')}</span><small>{encodeTicketClaim(ticket, state.variant)}</small></footer>
          <i style={{ ['--cols' as string]: cols }} />
        </article>
      )))}
    </section>
  )
}
