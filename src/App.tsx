import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { AboutDialog } from './components/AboutDialog'
import { LanClientView } from './components/LanClientView'
import { LanPanel } from './components/LanPanel'
import { Ball, EmptyBall } from './components/Ball'
import { BingoCard } from './components/BingoCard'
import { CalledBoard } from './components/CalledBoard'
import { Confetti } from './components/Confetti'
import { PatternPicker } from './components/PatternPicker'
import { PrintSheet } from './components/PrintSheet'
import { VerifyClaim } from './components/VerifyClaim'
import {
  ACCENTS,
  type GameState,
  MAX_PLAYERS,
  MAX_TICKETS,
  MIN_PLAYERS,
  type Pattern,
  PATTERNS,
  FREE,
  type Variant,
  letterFor,
  maxBall,
  makeGame,
  nextTombolaPattern,
  reduce,
} from './game'
import { I18nProvider, LANGS, type Lang, detectLang, speechLocale, staticT, useI18n } from './i18n'
import type { Key } from './locales/en'
import { isTauri } from './lan'
import { isApplePortable, useInstallPrompt } from './pwa'
import { useLanClient } from './useLanClient'
import { useLanHost } from './useLanHost'
import { announce, canSpeak, sfx, stopSpeaking } from './sound'
import { smorfiaFor } from './smorfia'
import { SmorfiaCall } from './components/SmorfiaCall'

const STORE_KEY = 'crispbingo:v3'
const LEGACY_STORE_KEY = 'bingo-party:v2'

type Saved = {
  names: string[]
  wins: number[]
  pattern: Pattern
  muted: boolean
  voice: boolean
  speed: number
  autoDaub: boolean
  variant: Variant
  ticketCount: number
  showLetters: boolean
}

function loadSaved(fallbackName: (n: number) => string): Saved {
  const base: Saved = {
    names: [1, 2, 3].map(fallbackName),
    wins: [0, 0, 0],
    pattern: 'line',
    muted: false,
    voice: false,
    speed: 3500,
    autoDaub: false,
    variant: '75',
    ticketCount: 1,
    showLetters: true,
  }
  try {
    const raw = localStorage.getItem(STORE_KEY) ?? localStorage.getItem(LEGACY_STORE_KEY)
    if (!raw) return base
    const p = JSON.parse(raw) as Partial<Saved>
    const names =
      Array.isArray(p.names) && p.names.length >= MIN_PLAYERS && p.names.length <= MAX_PLAYERS
        ? p.names.map(String)
        : base.names
    return {
      names,
      wins: Array.isArray(p.wins) && p.wins.length === names.length ? p.wins.map(Number) : names.map(() => 0),
      pattern: p.pattern && PATTERNS.includes(p.pattern) ? p.pattern : base.pattern,
      muted: typeof p.muted === 'boolean' ? p.muted : base.muted,
      voice: typeof p.voice === 'boolean' ? p.voice : base.voice,
      speed: typeof p.speed === 'number' ? p.speed : base.speed,
      autoDaub: typeof p.autoDaub === 'boolean' ? p.autoDaub : base.autoDaub,
      variant: p.variant === '90' || p.variant === 'tombola' ? p.variant : '75',
      ticketCount: typeof p.ticketCount === 'number' && p.ticketCount >= 1 && p.ticketCount <= MAX_TICKETS ? Math.round(p.ticketCount) : 1,
      showLetters: typeof p.showLetters === 'boolean' ? p.showLetters : true,
    }
  } catch {
    return base
  }
}

export default function App() {
  return (
    <I18nProvider>
      <Root />
    </I18nProvider>
  )
}

/**
 * A page served by a LAN host shows one player their own card; anything else
 * (the native app, GitHub Pages, a file) is the shared-screen game.
 */
function Root() {
  const client = useLanClient()
  if (client.phase === 'probing' || client.phase === 'none') return <Game />
  return <LanClientView client={client} />
}

function Game() {
  const { t, lang, setLang } = useI18n()
  const nameFor = useCallback((n: number) => t('player.default', { n }), [t])

  // default names have to exist before the provider mounts, so translate them statically
  const [saved] = useState(() => {
    const st = staticT(detectLang())
    return loadSaved((n) => st('player.default', { n }))
  })
  const [state, dispatch] = useReducer(reduce, undefined, (): GameState => {
    const g = makeGame(saved.names, saved.wins, saved.pattern, saved.variant, saved.ticketCount)
    return { ...g, speed: saved.speed, autoDaub: saved.autoDaub, showLetters: saved.showLetters }
  })
  const [muted, setMuted] = useState(saved.muted)
  const [voice, setVoice] = useState(saved.voice && canSpeak())
  const [showHelp, setShowHelp] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showLan, setShowLan] = useState(false)
  const [showVerify, setShowVerify] = useState(false)
  const { canInstall, install } = useInstallPrompt()

  const lan = useLanHost(state, dispatch, nameFor)

  // If the window opens onto an already-running share (a reload, or a host that
  // was started headless), put the join code straight on screen.
  const shownJoin = useRef(false)
  useEffect(() => {
    if (lan.info && !shownJoin.current) {
      shownJoin.current = true
      setShowLan(true)
    }
  }, [lan.info])

  const { players, drawn, bag, winners, pattern, variant, ticketCount, showLetters, autoDraw, autoDaub, speed, modalOpen } = state
  const called = useMemo(() => new Set(drawn), [drawn])
  const current = drawn.length ? drawn[drawn.length - 1] : null
  const over = winners.length > 0
  const bagEmpty = bag.length === 0

  // ---- persistence -------------------------------------------------------
  useEffect(() => {
    const data: Saved = {
      names: players.map((p) => p.name),
      wins: players.map((p) => p.wins),
      pattern,
      muted,
      voice,
      speed,
      autoDaub,
      variant,
      ticketCount,
      showLetters,
    }
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data))
    } catch {
      /* private mode — settings just won't stick */
    }
  }, [players, pattern, muted, voice, speed, autoDaub, variant, ticketCount, showLetters])

  // ---- sound + spoken caller (refs keep StrictMode from double-firing) ----
  const lastCalled = useRef(0)
  useEffect(() => {
    if (current === null || drawn.length === lastCalled.current) return
    lastCalled.current = drawn.length
    if (!muted) sfx.draw(current)
    if (voice) {
      const smorfia = variant === 'tombola' ? smorfiaFor(current) : undefined
      announce(letterFor(current, variant), current, variant === 'tombola' ? 'it-IT' : speechLocale(lang), smorfia?.label)
    }
  }, [drawn.length, current, muted, voice, lang, variant])

  const wonRef = useRef(false)
  useEffect(() => {
    if (over && !wonRef.current) {
      wonRef.current = true
      if (!muted) sfx.win()
    }
    if (!over) wonRef.current = false
  }, [over, muted])

  useEffect(() => () => stopSpeaking(), [])

  // ---- auto call ---------------------------------------------------------
  useEffect(() => {
    if (!autoDraw || over || bagEmpty) return
    const id = window.setInterval(() => dispatch({ type: 'draw' }), speed)
    return () => window.clearInterval(id)
  }, [autoDraw, over, bagEmpty, speed])

  const draw = useCallback(() => {
    sfx.unlock()
    dispatch({ type: 'draw' })
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.isContentEditable)) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (!over && !bagEmpty) draw()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [draw, over, bagEmpty])

  const daub = useCallback(
    (pid: number, ticket: number, cell: number): 'hit' | 'miss' | 'noop' => {
      if (over) return 'noop'
      const c = players[pid].tickets[ticket].grid[cell]
      if (c.marked || c.value === FREE) return 'noop'
      if (!called.has(c.value)) {
        if (!muted) sfx.miss()
        dispatch({ type: 'miss', player: pid })
        return 'miss'
      }
      if (!muted) sfx.daub()
      dispatch({ type: 'daub', player: pid, ticket, cell })
      return 'hit'
    },
    [called, muted, over, players],
  )

  const recent = drawn.slice(-6, -1).reverse()
  const winnerNames = winners.map((id) => players[id].name)
  const compact = players.length > 4
  const nextPrize = variant === 'tombola' ? nextTombolaPattern(pattern) : null

  return (
    <div className="app">
      <div className="app__glow" aria-hidden />

      <header className="topbar">
        <div className="brand">
          <strong className="brand__name">Crisp</strong>
          <span className="brand__balls" aria-hidden>
            <i style={{ ['--b' as string]: '#3b82f6' }}>B</i>
            <i style={{ ['--b' as string]: '#ef4444' }}>I</i>
            <i style={{ ['--b' as string]: '#22c55e' }}>N</i>
            <i style={{ ['--b' as string]: '#f59e0b' }}>G</i>
            <i style={{ ['--b' as string]: '#a855f7' }}>O</i>
          </span>
          <span className="brand__sub">{t('app.subtitle', { round: state.round, players: players.length })}</span>
        </div>

        <div className="topbar__actions">
          <label className="switch">
            <input
              type="checkbox"
              checked={autoDraw}
              disabled={over || bagEmpty}
              onChange={(e) => {
                sfx.unlock()
                dispatch({ type: 'setAutoDraw', value: e.target.checked })
              }}
            />
            <span>{t('ctl.autoCall')}</span>
          </label>

          <select className="select" value={variant} aria-label={t('ctl.variant')} onChange={(e) => dispatch({ type: 'setVariant', variant: e.target.value as Variant })}>
            <option value="75">{t('variant.75')}</option>
            <option value="90">{t('variant.90')}</option>
            <option value="tombola">{t('variant.tombola')}</option>
          </select>
          <select className="select" value={ticketCount} aria-label={t('ctl.tickets')} onChange={(e) => dispatch({ type: 'setTicketCount', value: Number(e.target.value) })}>
            {Array.from({ length: MAX_TICKETS }, (_, i) => <option key={i + 1} value={i + 1}>{t('ctl.ticketCount', { n: i + 1 })}</option>)}
          </select>
          {variant === '75' && <label className="switch">
            <input type="checkbox" checked={showLetters} onChange={(e) => dispatch({ type: 'setShowLetters', value: e.target.checked })} />
            <span>{t('ctl.letters')}</span>
          </label>}
          <select
            className="select"
            value={speed}
            aria-label={t('ctl.speed')}
            onChange={(e) => dispatch({ type: 'speed', value: Number(e.target.value) })}
          >
            <option value={5000}>{t('ctl.speed.slow')}</option>
            <option value={3500}>{t('ctl.speed.normal')}</option>
            <option value={2000}>{t('ctl.speed.fast')}</option>
            <option value={1200}>{t('ctl.speed.frantic')}</option>
          </select>
          <label className="switch">
            <input
              type="checkbox"
              checked={autoDaub}
              onChange={(e) => dispatch({ type: 'setAutoDaub', value: e.target.checked })}
            />
            <span>{t('ctl.autoDaub')}</span>
          </label>

          <button
            className={`btn btn--ghost ${muted ? '' : 'is-on'}`}
            onClick={() => setMuted((v) => !v)}
            title={t('ctl.sound')}
            aria-label={t('ctl.sound')}
            aria-pressed={!muted}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          {canSpeak() && (
            <button
              className={`btn btn--ghost ${voice ? 'is-on' : ''}`}
              onClick={() => {
                stopSpeaking()
                setVoice((v) => !v)
              }}
              title={t('ctl.voice')}
              aria-label={t('ctl.voice')}
              aria-pressed={voice}
            >
              🗣
            </button>
          )}

          <select
            className="select"
            value={lang}
            aria-label={t('ctl.language')}
            onChange={(e) => setLang(e.target.value as Lang)}
          >
            {Object.entries(LANGS).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>

          <button
            className="btn btn--ghost"
            onClick={() => setShowHelp((v) => !v)}
            aria-expanded={showHelp}
            title={t('ctl.help')}
          >
            ?
          </button>
          <button
            className={`btn btn--ghost ${lan.info ? 'is-on' : ''}`}
            onClick={() => setShowLan(true)}
            title={t('lan.title')}
            aria-label={t('lan.title')}
          >
            📶
          </button>
          <button className="btn btn--ghost" onClick={() => setShowAbout(true)} title={t('ctl.about')}>
            ⓘ
          </button>
          <button className="btn btn--ghost" onClick={() => window.print()} title={t('ctl.print')} aria-label={t('ctl.print')}>🖨</button>
          <button className="btn btn--ghost" onClick={() => setShowVerify(true)} title={t('verify.title')} aria-label={t('verify.title')}>✓</button>
          {canInstall && (
            <button className="btn btn--install" onClick={install}>
              ⤓ {t('ctl.install')}
            </button>
          )}
          <button className="btn" onClick={() => dispatch({ type: 'newRound' })}>
            {t('ctl.newRound')}
          </button>
        </div>
      </header>

      {showHelp && (
        <div className="help">
          <p>{t('help.play')}</p>
          <p>{t('help.win')}</p>
          <p className="help__install">{isApplePortable() ? t('help.installIos') : t('help.installOther')}</p>
        </div>
      )}

      <main className="stage">
        <aside className="caller-col">
          <div className="caller">
            <div className="caller__ball">
              {current === null ? <EmptyBall /> : <Ball n={current} variant={variant} spin={drawn.length} />}
            </div>
            {variant === 'tombola' && current !== null && <SmorfiaCall number={current} />}

            <p className="caller__say">
              {over
                ? t(variant === 'tombola' ? (winnerNames.length > 1 ? 'caller.tombolaMany' : 'caller.tombolaOne') : (winnerNames.length > 1 ? 'caller.bingoMany' : 'caller.bingoOne'), {
                    names: winnerNames.join(' & '), prize: t(`pattern.${pattern}` as Key),
                  })
                : current === null
                  ? t('caller.start')
                  : `${letterFor(current, variant) ? `${letterFor(current, variant)} — ` : ''}${current}`}
            </p>

            <button className="btn btn--call" onClick={draw} disabled={over || bagEmpty}>
              {bagEmpty ? t('caller.empty') : over ? t('caller.over') : t('caller.call')}
              <small>{t('ball.left', { n: maxBall(variant) - drawn.length })}</small>
            </button>

            <div className="recent" aria-label={t('caller.previous')}>
              {recent.length === 0 && <span className="recent__none">{t('caller.none')}</span>}
              {recent.map((n) => (
                <Ball key={n} n={n} variant={variant} size="sm" />
              ))}
            </div>
          </div>

          <div className="board-panel">
            <span className="panel__label">{t('ctl.pattern')}</span>
            <PatternPicker value={pattern} variant={variant} onChange={(p) => dispatch({ type: 'setPattern', pattern: p })} />
            <span className="pattern__hint">{t(`pattern.${pattern}.hint` as Key)}</span>
            {variant === 'tombola' && <span className="smorfia-note" title={t('smorfia.familyHint')}>{t('smorfia.family')}</span>}
            <CalledBoard called={called} current={current} label={t('caller.board')} variant={variant} />
          </div>
        </aside>

        <div className={`cards ${compact ? 'cards--many' : ''}`}>
          {players.flatMap((p) => p.tickets.map((ticket) => (
            <BingoCard
              key={`${p.id}-${ticket.id}`}
              player={p}
              ticket={ticket}
              variant={variant}
              showLetters={showLetters}
              called={called}
              pattern={pattern}
              isWinner={winners.includes(p.id)}
              frozen={over}
              canRemove={players.length > MIN_PLAYERS && lan.canRemovePlayer(p.id)}
              compact={compact}
              onDaub={(cell) => daub(p.id, ticket.id, cell)}
              onRename={(name) => dispatch({ type: 'rename', player: p.id, name })}
              onRemove={() => lan.removePlayer(p.id)}
            />
          )))}
        </div>
      </main>

      <footer className="footer">
        <div className="footer__left">
          {players.length < MAX_PLAYERS && (
            <button
              className="btn btn--tiny btn--add"
              style={{ ['--accent' as string]: ACCENTS[players.length % ACCENTS.length] }}
              onClick={() => dispatch({ type: 'addPlayer', name: nameFor(players.length + 1) })}
            >
              + {t('player.add')}
            </button>
          )}
          <button className="btn btn--ghost btn--tiny" onClick={() => dispatch({ type: 'resetScores' })}>
            {t('foot.reset')}
          </button>
        </div>
        <span>{t('foot.hint')}</span>
      </footer>

      <Confetti active={over} colors={[...ACCENTS.slice(0, 4), '#ffffff']} />
      <PrintSheet state={state} />

      {over && modalOpen && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal__box" style={{ ['--accent' as string]: players[winners[0]].accent }}>
            <span className="modal__kicker">{t('win.round', { round: state.round })}</span>
            <h2 className="modal__title">{variant === 'tombola' ? t('win.prizeTitle', { prize: t(`pattern.${pattern}` as Key) }) : t('win.title')}</h2>
            <p className="modal__who">{winnerNames.join(' & ')}</p>
            <p className="modal__detail">
              {t(variant === '75' ? 'win.detail' : 'win.detail90', {
                count: drawn.length,
                letter: letterFor(current ?? 1, variant),
                number: current ?? 0,
                misses: players[winners[0]].misses,
              })}
            </p>
            <div className="modal__scores">
              {players.map((p) => (
                <span key={p.id} style={{ ['--accent' as string]: p.accent }}>
                  <b>{p.name}</b> 🏆 {p.wins}
                </span>
              ))}
            </div>
            <div className="modal__actions">
              <button className="btn btn--call" onClick={() => dispatch({ type: variant === 'tombola' ? 'nextPrize' : 'newRound' })}>
                {nextPrize
                  ? t('win.nextPrize', { prize: t(`pattern.${nextPrize}` as Key) })
                  : t('win.next')}
              </button>
              <button className="btn btn--ghost" onClick={() => dispatch({ type: 'closeModal' })}>
                {t('win.look')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAbout && <AboutDialog onClose={() => setShowAbout(false)} />}
      {showVerify && <VerifyClaim state={state} onClose={() => setShowVerify(false)} />}

      {showLan && (
        <LanPanel
          info={lan.info}
          devices={Object.keys(lan.seats).length}
          busy={lan.busy}
          error={lan.error}
          native={isTauri()}
          onStart={() => void lan.start()}
          onStop={() => void lan.stop()}
          onClose={() => setShowLan(false)}
        />
      )}
    </div>
  )
}
