import { useEffect, useRef } from 'react'
import { RHYTHMS, PIXELS_PER_SEC, beatLenPx, afibBeatLen } from '../data/rhythms'

const SPEED = PIXELS_PER_SEC / 60  // px per frame @ 60fps

// Seeded PRNG
function seededRng(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return Math.abs(x - Math.floor(x))
}

// 3rd-Degree Block: two independent rates overlaid using absolute pixel offset
function thirdDegreeY(t) {
  const pCycleLen  = beatLenPx(75)
  const qrsCycleLen = beatLenPx(35)
  const pPhase   = (t % pCycleLen)  / pCycleLen
  const qrsPhase = (t % qrsCycleLen) / qrsCycleLen

  // P wave
  let p = 0
  if (pPhase > 0.08 && pPhase < 0.18)
    p = 0.15 * Math.sin((pPhase - 0.08) / 0.10 * Math.PI)

  // Wide ventricular QRS
  let q = 0
  if (qrsPhase > 0.06 && qrsPhase < 0.26) {
    const qt = (qrsPhase - 0.06) / 0.20
    q = 0.65 * Math.sin(qt * Math.PI)
  } else if (qrsPhase > 0.30 && qrsPhase < 0.50) {
    q = -0.18 * Math.sin((qrsPhase - 0.30) / 0.20 * Math.PI)
  }

  return p + q
}

export function useECGCanvas(canvasRef, rhythmId, options = {}) {
  const {
    pacerActive       = false,
    pacerRate         = 70,
    pacerOutput       = 0,
    captureThreshold  = 60,
    isRunning         = true,
  } = options

  const stateRef = useRef({
    offset:    0,
    beatNum:   0,
    beatStart: 0,
    beatLen:   beatLenPx(75),
    prevY:     null,
  })
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx   = canvas.getContext('2d')
    const W     = canvas.width
    const H     = canvas.height
    const MID   = H / 2
    const SCALE = H * 0.38

    const rhythm  = RHYTHMS[rhythmId] || RHYTHMS.NSR
    const pacing  = pacerActive
    const captured = pacing && pacerOutput >= captureThreshold
    const pacerCycleLen = beatLenPx(Math.max(30, pacerRate))

    // Reset beat tracking
    const s = stateRef.current
    s.offset    = 0
    s.beatNum   = 0
    s.beatStart = 0
    s.prevY     = null
    s.beatLen   = rhythm.type === 'chaos' || rhythm.type === 'dual'
      ? PIXELS_PER_SEC
      : beatLenPx(rhythm.rate)

    // Paint initial background
    ctx.fillStyle = '#050810'
    ctx.fillRect(0, 0, W, H)
    paintGrid(ctx, W, H, 0)

    function paintGrid(ctx, W, H, offsetX) {
      ctx.strokeStyle = 'rgba(0,60,40,0.45)'
      ctx.lineWidth = 0.5
      // major every 200px, minor every 40px
      for (let gx = 0; gx < W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx - (offsetX % 40), 0)
        ctx.lineTo(gx - (offsetX % 40), H); ctx.stroke()
      }
      for (let gy = 0; gy < H; gy += 20) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
      }
    }

    function computeNextBeatLen(beatNum) {
      if (rhythm.type === 'chaos' || rhythm.type === 'dual') return PIXELS_PER_SEC
      const base = beatLenPx(rhythm.rate)
      if (rhythm.type === 'irregular')
        return afibBeatLen(base, beatNum, rhythm.rateVariability)
      if (rhythm.type === 'cycle' && rhythm.rateVariability > 0) {
        const rng = seededRng(beatNum * 19 + 7)
        return base * (1 - rhythm.rateVariability / 2 + rhythm.rateVariability * rng)
      }
      return base
    }

    function getRhythmY(t) {
      if (rhythm.type === 'dual') return thirdDegreeY(t)
      if (rhythm.type === 'chaos') return rhythm.waveform(0, t)

      // Advance beat tracker
      while (t >= s.beatStart + s.beatLen) {
        s.beatStart += s.beatLen
        s.beatNum++
        s.beatLen = computeNextBeatLen(s.beatNum)
      }

      const x = Math.max(0, Math.min(0.9999, (t - s.beatStart) / s.beatLen))
      return rhythm.waveform(x, t, s.beatNum)
    }

    function getY(t) {
      if (pacing) {
        const pacerPhase = t % pacerCycleLen

        // Pacing spike
        if (pacerPhase < 2) return 1.05

        if (captured) {
          // Paced beat: wide QRS + inverted T
          if (pacerPhase >= 2 && pacerPhase < 18) {
            const qt = (pacerPhase - 2) / 16
            return 0.72 * Math.sin(qt * Math.PI)
          }
          if (pacerPhase >= 22 && pacerPhase < 42) {
            const tt = (pacerPhase - 22) / 20
            return -0.18 * Math.sin(tt * Math.PI)
          }
          return 0
        }
        // Not captured: underlying rhythm + spikes already drawn above
      }
      return getRhythmY(t)
    }

    function draw() {
      if (!isRunning) {
        rafRef.current = requestAnimationFrame(draw)
        return
      }

      const t = s.offset

      // Scroll canvas left by SPEED pixels
      ctx.drawImage(canvas, -SPEED, 0)

      // Erase right strip
      ctx.fillStyle = '#050810'
      ctx.fillRect(W - SPEED - 2, 0, SPEED + 2, H)

      // Draw grid in right strip
      ctx.strokeStyle = 'rgba(0,60,40,0.45)'
      ctx.lineWidth = 0.5
      const gxPos = W - SPEED - 2
      if (Math.round((t + SPEED) % 40) < SPEED + 2) {
        ctx.beginPath(); ctx.moveTo(gxPos, 0); ctx.lineTo(gxPos, H); ctx.stroke()
      }
      for (let gy = 0; gy < H; gy += 20) {
        ctx.beginPath(); ctx.moveTo(gxPos, gy); ctx.lineTo(W, gy); ctx.stroke()
      }

      // Compute and draw new trace point
      const y      = getY(t)
      const canvasY = MID - y * SCALE

      if (s.prevY !== null) {
        ctx.strokeStyle = '#00e5a0'
        ctx.lineWidth   = 2
        ctx.shadowColor = '#00e5a0'
        ctx.shadowBlur  = 5
        ctx.beginPath()
        ctx.moveTo(W - SPEED - 1, s.prevY)
        ctx.lineTo(W, canvasY)
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      s.prevY   = canvasY
      s.offset += SPEED

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rhythmId, pacerActive, pacerRate, pacerOutput, captureThreshold, isRunning])
}
