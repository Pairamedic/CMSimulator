import { useState } from 'react'
import { adminCreateAccount } from '../firebase'

const inputCls = 'mt-1 w-full bg-surface2 border border-ecg-border rounded-lg px-3 min-h-[44px] text-sm text-ink placeholder-ecg-gray focus:outline-none focus:border-ecg-green transition-colors'

function friendlyError(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/network-request-failed':
      return 'Network error — check your connection.'
    default:
      return 'Could not create the account. Please try again.'
  }
}

export default function AdminPanel({ onClose }) {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr]           = useState('')
  const [ok, setOk]             = useState('')
  const [busy, setBusy]         = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErr(''); setOk('')
    if (!email || !password) { setErr('Email and password are required.'); return }
    if (password.length < 6) { setErr('Password must be at least 6 characters.'); return }
    setBusy(true)
    try {
      await adminCreateAccount(email.trim(), password, name.trim() || undefined)
      setOk(`Account created for ${email.trim()}.`)
      setName(''); setEmail(''); setPassword('')
    } catch (e) {
      setErr(friendlyError(e.code))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-10 flex flex-col bg-surface border border-ecg-border rounded-2xl shadow-2xl w-full max-w-md max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ecg-border shrink-0">
          <div>
            <h2 className="text-sm font-bold text-ink tracking-widest uppercase">Create Account</h2>
            <p className="text-[10px] text-ecg-gray font-mono">Admin · add a new user</p>
          </div>
          <button onClick={onClose} className="text-ecg-gray hover:text-ink text-2xl leading-none px-2">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-[10px] text-ecg-green font-mono uppercase tracking-widest">Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Dr. Smith"
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-[10px] text-ecg-green font-mono uppercase tracking-widest">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@example.com"
              autoComplete="off"
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-[10px] text-ecg-green font-mono uppercase tracking-widest">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              autoComplete="new-password"
              required
              className={inputCls}
            />
          </div>

          {err && <p className="text-[11px] text-ecg-red">{err}</p>}
          {ok  && <p className="text-[11px] text-ecg-green">{ok}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full mt-2 py-3 rounded-xl border-2 border-ecg-green text-ecg-green font-bold text-sm uppercase tracking-widest bg-surface2 hover:bg-ecg-green hover:text-black disabled:opacity-40 transition-all active:scale-95"
          >
            {busy ? '…' : 'Create Account'}
          </button>

          <p className="text-[10px] text-ecg-gray leading-relaxed">
            The new user can sign in immediately with this email and password. You stay signed in.
          </p>
        </form>
      </div>
    </div>
  )
}
