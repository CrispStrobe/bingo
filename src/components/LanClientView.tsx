import { useState } from 'react'
import { FREE, MAX_PLAYERS, letterFor, distanceToBingo, type GameState } from '../game'
import { useI18n } from '../i18n'
import type { Key } from '../locales/en'
import { Ball, EmptyBall } from './Ball'
import { BingoCard } from './BingoCard'

type Client = {
  phase: 'probing' | 'none' | 'joining' | 'seated' | 'lost'
  state: GameState | null
  seat: number | null
  claimed: number[]
  notice: string | null
  claim: (o: { seat?: number; name?: string }) => void
  act: (a: import('../game').Action) => void
  leave: () => void
}

export function LanClientView({ client }: { client: Client }) {
  const { t } = useI18n()
  const { state, seat, claimed, phase } = client

  if (!state) {
    return (
      <div className="app app--client">
        <div className="app__glow" aria-hidden />
        <div className="lan__status">{phase === 'lost' ? t('lan.lost') : t('lan.connecting')}</div>
      </div>
    )
  }

  const me = seat !== null ? state.players[seat] : undefined
  const current = state.drawn.length ? state.drawn[state.drawn.length - 1] : null
  const called = new Set(state.drawn)
  const over = state.winners.length > 0

  return (
    <div className="app app--client">
      <div className="app__glow" aria-hidden />

      <header className="topbar topbar--client">
        <span className="brand__balls" aria-hidden>
          <i style={{ ['--b' as string]: '#3b82f6' }}>B</i>
          <i style={{ ['--b' as string]: '#ef4444' }}>I</i>
          <i style={{ ['--b' as string]: '#22c55e' }}>N</i>
          <i style={{ ['--b' as string]: '#f59e0b' }}>G</i>
          <i style={{ ['--b' as string]: '#a855f7' }}>O</i>
        </span>
        <span className="brand__sub">
          {t('app.subtitle', { round: state.round, players: state.players.length })}
        </span>
        {me && (
          <button className="btn btn--ghost btn--tiny" onClick={client.leave}>
            {t('lan.leave')}
          </button>
        )}
      </header>

      {phase === 'lost' && <div className="lan__banner">{t('lan.lost')}</div>}

      {!me ? (
        <JoinScreen state={state} claimed={claimed} notice={client.notice} onClaim={client.claim} />
      ) : (
        <main className="seat">
          <div className="seat__caller">
            {current === null ? <EmptyBall /> : <Ball n={current} spin={state.drawn.length} />}
            <div className="seat__callerText">
              <span className="seat__say">
                {over
                  ? t(state.winners.length > 1 ? 'caller.bingoMany' : 'caller.bingoOne', {
                      names: state.winners.map((i) => state.players[i].name).join(' & '),
                    })
                  : current === null
                    ? t('lan.waiting')
                    : `${letterFor(current)} — ${current}`}
              </span>
              <span className="seat__pattern">{t(`pattern.${state.pattern}` as Key)}</span>
            </div>
            <button
              className="btn btn--call seat__call"
              onClick={() => client.act({ type: 'draw' })}
              disabled={over || state.bag.length === 0}
            >
              {t('caller.call')}
            </button>
          </div>

          <BingoCard
            player={me}
            called={called}
            pattern={state.pattern}
            isWinner={state.winners.includes(me.id)}
            frozen={over}
            canRemove={false}
            compact={false}
            onDaub={(cell) => {
              const c = me.grid[cell]
              if (c.marked || c.value === FREE) return 'noop'
              if (!called.has(c.value)) {
                client.act({ type: 'miss', player: me.id })
                return 'miss'
              }
              client.act({ type: 'daub', player: me.id, cell })
              return 'hit'
            }}
            onRename={(name) => client.act({ type: 'rename', player: me.id, name })}
            onRemove={() => {}}
          />

          <section className="others">
            <span className="panel__label">{t('lan.others')}</span>
            <ul>
              {state.players
                .filter((p) => p.id !== me.id)
                .map((p) => (
                  <li key={p.id} style={{ ['--accent' as string]: p.accent }}>
                    <b>{p.name}</b>
                    <span>🏆 {p.wins}</span>
                    <span>{t('player.toGo', { n: distanceToBingo(p.grid, state.pattern) })}</span>
                  </li>
                ))}
            </ul>
          </section>
        </main>
      )}
    </div>
  )
}

function JoinScreen({
  state,
  claimed,
  notice,
  onClaim,
}: {
  state: GameState
  claimed: number[]
  notice: string | null
  onClaim: (o: { seat?: number; name?: string }) => void
}) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const taken = new Set(claimed)

  return (
    <main className="join">
      <h1 className="join__title">{t('lan.join')}</h1>
      {notice === 'full' && <p className="lan__note lan__note--bad">{t('lan.full')}</p>}

      <ul className="join__seats">
        {state.players.map((p) => (
          <li key={p.id}>
            <button
              className="join__seat"
              style={{ ['--accent' as string]: p.accent }}
              disabled={taken.has(p.id)}
              onClick={() => onClaim({ seat: p.id })}
            >
              <b>{p.name}</b>
              <span>{taken.has(p.id) ? t('lan.taken') : t('lan.takeSeat')}</span>
            </button>
          </li>
        ))}
      </ul>

      {state.players.length < MAX_PLAYERS && (
        <form
          className="join__new"
          onSubmit={(e) => {
            e.preventDefault()
            onClaim({ name: name.trim() || undefined })
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={14}
            placeholder={t('lan.namePlaceholder')}
            aria-label={t('lan.namePlaceholder')}
          />
          <button className="btn btn--call" type="submit">
            {t('lan.joinAs')}
          </button>
        </form>
      )}
    </main>
  )
}
