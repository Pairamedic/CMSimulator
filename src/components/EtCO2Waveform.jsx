import { useRef, useState, useEffect } from 'react'
import { useSimulator } from '../context/SimulatorContext'
import { useEtCO2Canvas } from '../hooks/useEtCO2Canvas'

const CSS_HEIGHT = 64

export default function EtCO2Waveform() {
  const { state } = useSimulator()
  const containerRef = useRef(null)
  const canvasRef    = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)

  useEffect(() => {
    const el     = containerRef.current
    const canvas = canvasRef.current
    if (!el || !canvas) return

    function resize() {
      const w = el.offsetWidth
      if (!w) return
      const dpr = window.devicePixelRatio || 1
      // Backing store only — the canvas's on-screen box is sized by CSS
      // (w-full h-full below), so a stale/early measurement here can only
      // blur a frame, never leave the trace stuck at the wrong width.
      canvas.width  = Math.round(w * dpr)
      canvas.height = Math.round(CSS_HEIGHT * dpr)
      setCanvasReady(v => !v)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEtCO2Canvas(canvasRef, {
    isRunning: state.isRunning,
    etco2: state.vitals.etco2,
    _canvasReady: canvasReady,
  })

  return (
    <div className="flex items-stretch shrink-0 border-t border-ecg-border/40" style={{ height: CSS_HEIGHT }}>
      <div className="flex items-center justify-center bg-ecg-bg w-7 shrink-0">
        <span
          className="text-[9px] text-ecg-amber font-mono font-bold"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          CO₂
        </span>
      </div>
      <div ref={containerRef} className="flex-1 relative overflow-hidden" style={{ background: '#0a0c0f' }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  )
}
