import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  MessageCircle,
  Mail,
  Smartphone,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import {
  requestOtp,
  verifyOtp,
  requestMagicLink,
  googleSignIn,
  getErrorMessage,
  type AuthChallengeResponse,
} from '@/lib/memberApi'

type Tab = 'whatsapp' | 'email' | 'google'

const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID?.trim?.() || ''

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string
            callback: (resp: { credential: string }) => void
          }) => void
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void
          prompt: () => void
        }
      }
    }
  }
}

export function MemberLoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const nextPath = params.get('next') || '/m'

  const [tab, setTab] = useState<Tab>('whatsapp')
  const login = useMemberAuthStore((s) => s.login)

  /** Handle the response from any auth verify call */
  function handleAuthResult(result: AuthChallengeResponse) {
    if (result.token) {
      login(result.token.member, result.token.access_token)
      navigate(nextPath, { replace: true })
      return
    }
    if (result.choices && result.choices.length > 0) {
      // Stash choices for the picker. Use sessionStorage so they don't
      // outlive the browser tab; they expire server-side in 10 min anyway.
      sessionStorage.setItem('member_gym_choices', JSON.stringify(result.choices))
      navigate(`/m/select-gym?next=${encodeURIComponent(nextPath)}`, { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero */}
      <div className="relative px-5 pt-12 pb-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-lime-400/10 blur-[140px] rounded-full" />
        </div>
        <div className="relative max-w-md mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-lime-400/30 bg-lime-400/5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-[10px] tracking-[0.25em] uppercase text-lime-400 font-medium">
              Your ActiveHQ
            </span>
          </div>
          <h1 className="text-4xl font-bold leading-tight">
            Sign in to your <span className="text-lime-400">gym.</span>
          </h1>
          <p className="mt-3 text-white/60 text-sm leading-relaxed">
            See your plan, attendance and payments. No passwords — pick one of the three options below.
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="px-5">
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/10">
            <TabButton active={tab === 'whatsapp'} onClick={() => setTab('whatsapp')} icon={<MessageCircle className="w-4 h-4" />}>
              WhatsApp
            </TabButton>
            <TabButton active={tab === 'email'} onClick={() => setTab('email')} icon={<Mail className="w-4 h-4" />}>
              Email
            </TabButton>
            <TabButton active={tab === 'google'} onClick={() => setTab('google')} icon={<Smartphone className="w-4 h-4" />}>
              Google
            </TabButton>
          </div>
        </div>
      </div>

      {/* Tab panel */}
      <div className="flex-1 px-5 pt-6 pb-12">
        <div className="max-w-md mx-auto">
          {tab === 'whatsapp' && <WhatsAppTab onResult={handleAuthResult} />}
          {tab === 'email' && <EmailTab />}
          {tab === 'google' && <GoogleTab onResult={handleAuthResult} />}
        </div>
      </div>

      <footer className="px-5 py-6 text-center text-xs text-white/40">
        Not a member yet? Ask your gym to add you, then come back here.
      </footer>
    </div>
  )
}

/* ───────────────────────────────── Tabs ─────────────────────────────── */

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
        active
          ? 'bg-lime-400 text-black shadow-[0_0_24px_rgba(163,230,53,0.4)]'
          : 'text-white/60 hover:text-white'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

/* ───────────────────────────── WhatsApp / OTP ───────────────────────── */

function WhatsAppTab({ onResult }: { onResult: (r: AuthChallengeResponse) => void }) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [stage, setStage] = useState<'phone' | 'code'>('phone')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [debugCode, setDebugCode] = useState<string | null>(null)

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const r = await requestOtp(phone.trim())
      setDebugCode(r.debug_code ?? null)
      setStage('code')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await verifyOtp(phone.trim(), code.trim())
      onResult(result)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return stage === 'phone' ? (
    <form onSubmit={handleRequest} className="space-y-4">
      <Field label="WhatsApp number" hint="We'll send a 6-digit code to this number">
        <input
          type="tel"
          inputMode="tel"
          required
          autoFocus
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          className={inputCls}
        />
      </Field>
      {error && <ErrorBanner message={error} />}
      <PrimaryButton type="submit" disabled={busy || !phone}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
        Send WhatsApp code
      </PrimaryButton>
      <p className="text-[11px] text-white/30 text-center leading-relaxed">
        By continuing you confirm this is the number on file at your gym.
      </p>
    </form>
  ) : (
    <form onSubmit={handleVerify} className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl bg-lime-400/5 border border-lime-400/20 p-3">
        <CheckCircle2 className="w-4 h-4 text-lime-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-white/70 leading-relaxed">
          Code sent to <span className="text-white font-semibold">{phone}</span>. It expires in 5 minutes.
        </p>
      </div>

      {debugCode && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-200">
          <strong>Dev:</strong> code is <code className="font-mono">{debugCode}</code>
        </div>
      )}

      <Field label="6-digit code">
        <input
          type="text"
          inputMode="numeric"
          required
          autoFocus
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="••••••"
          className={`${inputCls} tracking-[0.5em] text-center font-mono text-lg`}
        />
      </Field>
      {error && <ErrorBanner message={error} />}
      <PrimaryButton type="submit" disabled={busy || code.length < 4}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        Verify and sign in
      </PrimaryButton>
      <button
        type="button"
        className="block w-full text-center text-xs text-white/50 hover:text-white"
        onClick={() => {
          setStage('phone')
          setCode('')
          setDebugCode(null)
        }}
      >
        Use a different number
      </button>
    </form>
  )
}

/* ─────────────────────────────── Email ──────────────────────────────── */

function EmailTab() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [debugLink, setDebugLink] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const r = await requestMagicLink(email.trim())
      setDebugLink(r.debug_link ?? null)
      setSent(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-lime-400/5 border border-lime-400/30 p-5">
          <CheckCircle2 className="w-6 h-6 text-lime-400 mb-3" />
          <h3 className="text-white text-lg font-bold mb-1">Check your inbox</h3>
          <p className="text-sm text-white/60 leading-relaxed">
            We've sent a sign-in link to <span className="text-white font-semibold">{email}</span>.
            Open it on this device — the link expires in 15 minutes.
          </p>
        </div>
        {debugLink && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-200 break-all">
            <strong>Dev:</strong>{' '}
            <a href={debugLink} className="underline text-amber-100">
              {debugLink}
            </a>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setSent(false)
            setDebugLink(null)
          }}
          className="block w-full text-center text-xs text-white/50 hover:text-white"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email address" hint="The email on file with your gym">
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className={inputCls}
        />
      </Field>
      {error && <ErrorBanner message={error} />}
      <PrimaryButton type="submit" disabled={busy || !email.includes('@')}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        Email me a sign-in link
      </PrimaryButton>
    </form>
  )
}

/* ─────────────────────────────── Google ─────────────────────────────── */

function GoogleTab({ onResult }: { onResult: (r: AuthChallengeResponse) => void }) {
  const buttonRef = useRef<HTMLDivElement | null>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Inject Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    if (window.google?.accounts?.id) {
      setScriptReady(true)
      return
    }
    const tag = document.createElement('script')
    tag.src = 'https://accounts.google.com/gsi/client'
    tag.async = true
    tag.defer = true
    tag.onload = () => setScriptReady(true)
    tag.onerror = () => setError('Could not load Google sign-in. Try email or WhatsApp instead.')
    document.head.appendChild(tag)
    return () => {
      // intentionally leave the script attached for future tab visits
    }
  }, [])

  // Init + render the official Google button once SDK is ready
  useEffect(() => {
    if (!scriptReady || !GOOGLE_CLIENT_ID || !buttonRef.current) return
    const g = window.google?.accounts?.id
    if (!g) return
    g.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (resp) => {
        try {
          setBusy(true)
          setError('')
          const result = await googleSignIn(resp.credential)
          onResult(result)
        } catch (err) {
          setError(getErrorMessage(err))
        } finally {
          setBusy(false)
        }
      },
    })
    g.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      shape: 'pill',
      text: 'signin_with',
      logo_alignment: 'left',
      width: 320,
    })
  }, [scriptReady, onResult])

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <p className="text-sm text-white/70 leading-relaxed">
          Google sign-in isn't configured for this deployment yet. Use{' '}
          <span className="text-lime-400">WhatsApp</span> or{' '}
          <span className="text-lime-400">Email</span> instead — both work right now.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center">
        <p className="text-sm text-white/60 leading-relaxed mb-5">
          Sign in with the Google account that matches the email on file at your gym.
        </p>
        {busy && (
          <div className="flex items-center justify-center gap-2 text-sm text-lime-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing in…
          </div>
        )}
        <div ref={buttonRef} className="flex justify-center min-h-[44px]" />
      </div>
      {error && <ErrorBanner message={error} />}
    </div>
  )
}

/* ────────────────────────── Shared primitives ───────────────────────── */

const inputCls =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 transition'

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[11px] tracking-[0.2em] uppercase text-white/50">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-white/40">{hint}</span>}
    </label>
  )
}

function PrimaryButton({
  children,
  type = 'button',
  disabled,
  onClick,
}: {
  children: React.ReactNode
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-lime-400 text-black font-bold hover:bg-lime-300 hover:shadow-[0_0_30px_rgba(163,230,53,0.45)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      {children}
    </button>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
      {message}
    </div>
  )
}
