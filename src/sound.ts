/** Tiny WebAudio blip synth — no assets, so nothing extra to host on Pages. */
let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

type ToneOpts = { freq: number; dur?: number; type?: OscillatorType; gain?: number; delay?: number; slideTo?: number }

function tone({ freq, dur = 0.15, type = 'sine', gain = 0.12, delay = 0, slideTo }: ToneOpts) {
  const ac = audio()
  if (!ac) return
  const t0 = ac.currentTime + delay
  const osc = ac.createOscillator()
  const amp = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  amp.gain.setValueAtTime(0.0001, t0)
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(amp).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

export const sfx = {
  draw(ball: number) {
    // pitch rises with the ball number, so the caller sounds different every time
    tone({ freq: 320 + (ball / 75) * 420, dur: 0.22, type: 'triangle', gain: 0.1 })
    tone({ freq: 660 + (ball / 75) * 500, dur: 0.14, type: 'sine', gain: 0.05, delay: 0.06 })
  },
  daub() {
    tone({ freq: 880, dur: 0.09, type: 'square', gain: 0.05, slideTo: 1320 })
  },
  miss() {
    tone({ freq: 180, dur: 0.18, type: 'sawtooth', gain: 0.06, slideTo: 90 })
  },
  win() {
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((f, i) => tone({ freq: f, dur: 0.42, type: 'triangle', gain: 0.11, delay: i * 0.12 }))
  },
  unlock() {
    audio()
  },
}

// --- spoken caller ---------------------------------------------------------
// Uses the platform's own voices, so it works offline on every target.

let voices: SpeechSynthesisVoice[] = []

function loadVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  voices = window.speechSynthesis.getVoices()
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices()
  window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickVoice(locale: string): SpeechSynthesisVoice | undefined {
  if (!voices.length) loadVoices()
  const base = locale.split('-')[0]
  return (
    voices.find((v) => v.lang.replace('_', '-') === locale) ??
    voices.find((v) => v.lang.replace('_', '-').startsWith(base))
  )
}

/** Announce a ball the way a caller would: "B — twelve". */
export function announce(letter: string, n: number, locale: string) {
  if (!canSpeak()) return
  const u = new SpeechSynthesisUtterance(`${letter}. ${n}`)
  u.lang = locale
  const voice = pickVoice(locale)
  if (voice) u.voice = voice
  u.rate = 0.92
  u.pitch = 1.05
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel()
}
