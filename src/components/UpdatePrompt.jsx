import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

// Normal auto-updating PWA. When a newer deploy is detected the new service
// worker is activated and the page reloads automatically, so users always get
// the current build and never get stuck on a stale, white-screening shell.
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // While the app stays open, poll hourly so a fresh deploy is picked up
      // without the user having to fully relaunch.
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000)
      }
    },
  })

  useEffect(() => {
    if (needRefresh) updateServiceWorker(true)
  }, [needRefresh, updateServiceWorker])

  return null
}
