import { useEffect, useRef } from 'react'
import { RHYTHMS, PIXELS_PER_SEC, beatLenPx, afibBeatLen } from '../data/rhythms'

const SPEED = PIXELS_PER_SEC / 60  // CSS px/frame @ 60fps

function seededRng(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return Math.abs(x - Math.floor(x))
}

// 3rd-Degree Block: independent atrial (75 bpm) + ventricular (35 bpm) rates
function thirdDegreeY(t) {
  const pCL   = beatLenPx(75)
  const qrsCL = beatLenPx(35)
  const pPh   = (t % pCL)   / pCL
  const qrsPh = (t % qrsCL) / qrsCL

  const p = pPh > 0.08 && pPh < 0.18
    ? 0.15 * Math.sin((pPh - 0.08) / 0.10 * Math.PI)
    : 0

  let q = 0
  if (qrsPh > 0.06 && qrsPh < 0.26)
    q = 0.65 * Math.sin((qrsPh - 0.06) / 0.20 * Math.PI)
  else if (qrsPh > 0.30 && qrsPh < 0.50)
    q = -0.18 * Math.sin((qrsPh - 0.30) / 0.20 * Math.PI)

  return p + q
}

export function useECGCanvas(canvasRef, rhythmId, options = {}) {
  const {
    pacerActive       = false,
    pacerRate         = 70,
    pacerOutput       = 0,
    captureThreshold  = 60,
    isRunning         = true,
    syncMode          = false,
    _canvasReady,
  } = options

  const stateRef = useRef({ offset: 0, beatNum: 0, beatStart: 0, beatLen: beatLenPx(75), prevY: null, prevRawY: null })
  const rafRef   = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!canvas.width || !canvas.height) return

    // Work in CSS pixel space — scale ctx to match physical pixels
    const dpr   = window.devicePixelRatio || 1
    const W     = canvas.width  / dpr   // CSS px
    const H     = canvas.height / dpr   // CSS px
    const MID   = H / 2
    const SCALE = H * 0.38

    const rhythm   = RHYTHMS[rhythmId] || RHYTHMS.NSR
    const pacing   = pacerActive
    const captured = pacing && pacerOutput >= captureThreshold
    const pacerCL  = beatLenPx(Math.max(30, pacerRate))

    const s = stateRef.current
    s.offset    = 0
    s.beatNum   = 0
    s.beatStart = 0
    s.prevY     = null
    s.prevRawY  = null
    s.beatLen   = (rhythm.type === 'chaos' || rhythm.type === 'dual')
      ? PIXELS_PER_SEC
      : beatLenPx(rhythm.rate)

    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.fillStyle = '#050810'
    ctx.fillRect(0, 0, W, H)
    drawGrid(ctx, W, H)

    function drawGrid(c, w, h) {
      c.save()
      c.strokeStyle = 'rgba(0,70,45,0.5)'
      c.lineWidth = 0.5
      for (let gx = 0; gx < w; gx += 40) {
        c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, h); c.stroke()
      }
      for (let gy = 0; gy < h; gy += 20) {
        c.beginPath(); c.moveTo(0, gy); c.lineTo(w, gy); c.stroke()
      }
      c.restore()
    }

    function nextBeatLen(beatNum) {
      if (rhythm.type === 'chaos' || rhythm.type === 'dual') return PIXELS_PER_SEC
      const base = beatLenPx(rhythm.rate)
      if (rhythm.type === 'irregular')
        return afibBeatLen(base, beatNum, rhythm.rateVariability)
      if (rhythm.rateVariability > 0) {
        const rng = seededRng(beatNum * 19 + 7)
        return base * (1 - rhythm.rateVariability / 2 + rhythm.rateVariability * rng)
      }
      return base
    }

    function rhythmY(t) {
      if (rhythm.type === 'dual')  return thirdDegreeY(t)
      if (rhythm.type === 'chaos') return rhythm.waveform(0, t)

      while (t >= s.beatStart + s.beatLen) {
        s.beatStart += s.beatLen
        s.beatNum++
        s.beatLen = nextBeatLen(s.beatNum)
      }

      const x = Math.max(0, Math.min(0.9999, (t - s.beatStart) / s.beatLen))
      return rhythm.waveform(x, t, s.beatNum)
    }

    function getY(t) {
      if (pacing) {
        const ph = t % pacerCL
        if (ph < 2) return 1.05
        if (captured) {
          if (ph >= 2  && ph < 18) return 0.72 * Math.sin((ph - 2)  / 16 * Math.PI)
          if (ph >= 22 && ph < 42) return -0.18 * Math.sin((ph - 22) / 20 * Math.PI)
          return 0
        }
      }
      return rhythmY(t)
    }

    function draw() {
      if (!isRunning) {
        rafRef.current = requestAnimationFrame(draw)
        return
      }

      const t = s.offset

      // Scroll: reset to identity so drawImage shifts by physical pixels, then restore scale
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(canvas, -Math.round(SPEED * dpr), 0)
      ctx.restore()

      // Erase right strip (CSS px space)
      ctx.fillStyle = '#050810'
      ctx.fillRect(W - SPEED - 2, 0, SPEED + 2, H)

      // Grid lines in right strip
      ctx.strokeStyle = 'rgba(0,70,45,0.5)'
      ctx.lineWidth = 0.5
      const stripX = W - SPEED - 2
      if (Math.round((t + SPEED) % 40) < Math.ceil(SPEED) + 2) {
        ctx.beginPath(); ctx.moveTo(stripX, 0); ctx.lineTo(stripX, H); ctx.stroke()
      }
      for (let gy = 0; gy < H; gy += 20) {
        ctx.beginPath(); ctx.moveTo(stripX, gy); ctx.lineTo(W, gy); ctx.stroke()
      }

      // Draw trace
      const y       = getY(t)
      const canvasY = MID - y * SCALE

      if (s.prevY !== null) {
        ctx.strokeStyle = '#00e5a0'
        ctx.lineWidth   = 1.5
        ctx.shadowColor = '#00e5a0'
        ctx.shadowBlur  = 4
        ctx.beginPath()
        ctx.moveTo(W - SPEED - 1, s.prevY)
        ctx.lineTo(W, canvasY)
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // Sync mode: draw marker at right edge on R-peak; scrolls naturally with trace.
      if (syncMode) {
        const nextRawY = getY(t + SPEED)
        const prevRaw  = s.prevRawY ?? 0
        if (y > 0.45 && y > prevRaw && y >= nextRawY) {
          ctx.save()
          ctx.fillStyle = '#ffffff'
          const hw = 4, th = 8
          const tipX = W - 1
          const tipY = canvasY - 4
          ctx.beginPath()
          ctx.moveTo(tipX - hw, tipY - th)
          ctx.lineTo(tipX + hw, tipY - th)
          ctx.lineTo(tipX,      tipY)
          ctx.closePath()
          ctx.fill()
          ctx.restore()
        }
        s.prevRawY = y
      }

      s.prevY   = canvasY
      s.offset += SPEED

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rhythmId, pacerActive, pacerRate, pacerOutput, captureThreshold, isRunning, syncMode, _canvasReady])
}
