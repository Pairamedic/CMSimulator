import { initializeApp, getApps, deleteApp } from 'firebase/app'
import {
  getFirestore, collection, addDoc, getDocs,
  deleteDoc, doc, query, orderBy,
} from 'firebase/firestore'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'

const cfg = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || '',
}

export const firebaseReady = !!(cfg.apiKey && cfg.projectId)

// Accounts in this list may create new user accounts from inside the app.
export const ADMIN_EMAILS = ['eliasacaldwellnrp@gmail.com']

export function isAdmin(user) {
  return !!user && ADMIN_EMAILS.includes((user.email || '').toLowerCase())
}

function getApp() {
  return getApps().length ? getApps()[0] : initializeApp(cfg)
}

let _db = null
function db() {
  if (!firebaseReady) throw new Error('Firebase not configured — add VITE_FIREBASE_* to .env')
  if (!_db) _db = getFirestore(getApp())
  return _db
}

let _auth = null
function auth() {
  if (!firebaseReady) throw new Error('Firebase not configured')
  if (!_auth) _auth = getAuth(getApp())
  return _auth
}

// ── Auth ──────────────────────────────────────────────────
export function subscribeAuth(callback) {
  if (!firebaseReady) { callback(null); return () => {} }
  return onAuthStateChanged(auth(), callback)
}

export async function signIn(email, password) {
  return signInWithEmailAndPassword(auth(), email, password)
}

export async function signUp(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth(), email, password)
  if (displayName) await updateProfile(cred.user, { displayName })
  return cred
}

export async function signOut() {
  return fbSignOut(auth())
}

// Create a new user account without disturbing the current (admin) session.
// createUserWithEmailAndPassword signs in as the new user, so we run it on a
// throwaway secondary Firebase app and tear it down afterwards.
export async function adminCreateAccount(email, password, displayName) {
  if (!firebaseReady) throw new Error('Firebase not configured')
  const secondaryApp = initializeApp(cfg, `admin-create-${Date.now()}`)
  try {
    const secondaryAuth = getAuth(secondaryApp)
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    if (displayName) await updateProfile(cred.user, { displayName })
    await fbSignOut(secondaryAuth)
    return cred
  } finally {
    await deleteApp(secondaryApp)
  }
}

// ── Scenario storage ──────────────────────────────────────
export async function fbSaveScenario(payload) {
  const ref = await addDoc(collection(db(), 'acls_scenarios'), {
    ...payload,
    savedAt: Date.now(),
  })
  return ref.id
}

export async function fbLoadScenarios() {
  const snap = await getDocs(
    query(collection(db(), 'acls_scenarios'), orderBy('savedAt', 'desc'))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function fbDeleteScenario(id) {
  await deleteDoc(doc(db(), 'acls_scenarios', id))
}

// ── Student simulation sessions ───────────────────────────
export async function fbSaveSession(payload) {
  const ref = await addDoc(collection(db(), 'acls_sessions'), {
    ...payload,
    savedAt: Date.now(),
  })
  return ref.id
}

export async function fbLoadSessions() {
  const snap = await getDocs(
    query(collection(db(), 'acls_sessions'), orderBy('savedAt', 'desc'))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function fbDeleteSession(id) {
  await deleteDoc(doc(db(), 'acls_sessions', id))
}
