import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, homePath } from '../store/auth'
import { api } from '../api'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const doLogin = async (em: string, pw: string) => {
    setBusy(true)
    setError(null)
    try {
      const result = await api.login({ email: em, password: pw })
      useAuth.setState({ token: result.token, user: result.user })
      navigate(homePath(result.user), { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Enter your email and password')
      return
    }
    void doLogin(email, password)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center text-white">
          <img src="/favicon.svg" alt="" className="mb-4 h-16 w-16 rounded-2xl shadow-2xl shadow-brand-900/50" />
          <h1 className="text-2xl font-extrabold tracking-tight">Zvend Meter Installation System</h1>
          <p className="mt-1.5 text-sm text-slate-400">Digitized meter activation workflow</p>
        </div>

        <form onSubmit={onSubmit} className="animate-fade-in-up rounded-3xl bg-white p-7 shadow-2xl shadow-black/40">
          <h2 className="text-lg font-bold text-slate-900">Sign in</h2>
          <p className="mt-0.5 text-sm text-slate-500">Use your Zvend account to continue.</p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <label className="mt-5 block">
            <span className="label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@zvend.com"
              autoComplete="username"
              className="input"
            />
          </label>

          <label className="mt-4 block">
            <span className="label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="input"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="btn-primary mt-6 w-full py-3 text-base"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}