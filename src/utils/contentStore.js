// Content catalog loader with an offline fallback, mirroring the pattern in
// sessionStore.js: use Firestore when Firebase is configured, otherwise serve
// the locally-bundled catalog so the app works with no backend.
import { firebaseReady, fbLoadContent } from '../firebase'
import { OFFLINE_CONTENT } from '../data/offlineContent'

export async function loadContent() {
  if (firebaseReady) return fbLoadContent()
  return OFFLINE_CONTENT
}
