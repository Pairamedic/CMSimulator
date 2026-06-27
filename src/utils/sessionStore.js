// Session persistence with graceful fallback:
// uses Firebase/Firestore when configured, otherwise the browser's
// localStorage so the feature works on the deployed site immediately.
import {
  firebaseReady,
  fbSaveSession, fbLoadSessions, fbDeleteSession,
} from '../firebase'

export const usingCloud = firebaseReady

const LS_KEY = 'acls_sessions'

function lsLoad() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') }
  catch { return [] }
}
function lsWrite(arr) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(arr)) } catch {}
}

export async function saveSession(payload) {
  if (firebaseReady) return fbSaveSession(payload)
  const all = lsLoad()
  const id = 'local-' + Date.now()
  all.unshift({ id, ...payload, savedAt: Date.now() })
  lsWrite(all)
  return id
}

export async function loadSessions() {
  if (firebaseReady) return fbLoadSessions()
  return lsLoad().sort((a, b) => b.savedAt - a.savedAt)
}

export async function deleteSession(id) {
  if (firebaseReady) return fbDeleteSession(id)
  lsWrite(lsLoad().filter(s => s.id !== id))
}
