// Instructor scenario persistence with graceful fallback — same shape as
// sessionStore.js: Firestore when Firebase is configured, otherwise the
// browser's localStorage so saved scenarios survive offline on this device.
import {
  firebaseReady,
  fbSaveScenario, fbLoadScenarios, fbDeleteScenario,
} from '../firebase'

const LS_KEY = 'acls_scenarios'

function lsLoad() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') }
  catch { return [] }
}
function lsWrite(arr) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(arr)) } catch {}
}

export async function saveScenario(payload) {
  if (firebaseReady) return fbSaveScenario(payload)
  const all = lsLoad()
  const id = 'local-' + Date.now()
  all.unshift({ id, ...payload, savedAt: Date.now() })
  lsWrite(all)
  return id
}

export async function loadScenarios() {
  if (firebaseReady) return fbLoadScenarios()
  return lsLoad().sort((a, b) => b.savedAt - a.savedAt)
}

export async function deleteScenario(id) {
  if (firebaseReady) return fbDeleteScenario(id)
  lsWrite(lsLoad().filter(s => s.id !== id))
}
