import { useEffect, useRef } from 'react'

type Piece = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; w: number; h: number; c: string }

export function Confetti({ active, colors }: { active: boolean; colors: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !active) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let raf = 0
    let running = true

    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const W = () => window.innerWidth
    const pieces: Piece[] = Array.from({ length: 160 }, () => ({
      x: Math.random() * W(),
      y: Math.random() * window.innerHeight * 1.3 - window.innerHeight * 0.75,
      vx: (Math.random() - 0.5) * 1.8,
      vy: 2.5 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.25,
      w: 6 + Math.random() * 7,
      h: 9 + Math.random() * 10,
      c: colors[Math.floor(Math.random() * colors.length)],
    }))

    const tick = () => {
      if (!running) return
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      for (const p of pieces) {
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        p.vy += 0.02
        if (p.y > window.innerHeight + 30) {
          p.y = -30
          p.x = Math.random() * W()
          p.vy = 2 + Math.random() * 3.5
        }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.c
        ctx.globalAlpha = 0.9
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * (0.5 + Math.abs(Math.cos(p.rot)) * 0.5))
        ctx.restore()
      }
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [active, colors])

  if (!active) return null
  return <canvas ref={ref} className="confetti" aria-hidden />
}
