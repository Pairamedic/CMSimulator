import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [light, setLight] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem('acls_theme') === 'light'
  )

  useEffect(() => {
    const el = document.documentElement
    el.classList.toggle('theme-light', light)
    el.classList.toggle('theme-dark', !light)
    try { localStorage.setItem('acls_theme', light ? 'light' : 'dark') } catch {}
  }, [light])

  return (
    <button
      role="switch"
      aria-checked={light}
      aria-label="Toggle light theme"
      onClick={() => setLight(v => !v)}
      className="relative h-7 w-[52px] shrink-0 rounded-full border border-ecg-border bg-surface2 transition-colors"
    >
      {/* sun / moon hints */}
      <span className="absolute inset-0 flex items-center justify-between px-1.5 text-[9px] leading-none text-ecg-gray">
        <span>☀</span>
        <span>☾</span>
      </span>
      {/* white knob */}
      <span
        className={`absolute top-[2px] h-[22px] w-[22px] rounded-full bg-white shadow-md transition-transform duration-200 ${
          light ? 'translate-x-[2px]' : 'translate-x-[28px]'
        }`}
      />
    </button>
  )
}
