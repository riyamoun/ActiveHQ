import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authService, gymService } from '@/services/authService'
import { getErrorMessage } from '@/lib/api'
import { AUTH_CONSTANTS } from '@/constants'
import { trackEvent } from '@/lib/analytics'
import toast from 'react-hot-toast'
import { Sparkles, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'

const DEMO_CREDENTIALS = AUTH_CONSTANTS.DEMO_CREDENTIALS
const DEMO_EMAIL = DEMO_CREDENTIALS.email
const DEMO_PASSWORD = DEMO_CREDENTIALS.password

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const isDemo = searchParams.get('demo') === 'true'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  useEffect(() => {
    if (isDemo) {
      setEmail(DEMO_EMAIL)
      setPassword(DEMO_PASSWORD)
    }
  }, [isDemo])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email address'
    if (!password) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)

    try {
      let tokens: Awaited<ReturnType<typeof authService.login>>
      try {
        tokens = await authService.login({ email, password })
      } catch (firstError: unknown) {
        const is401 = (firstError as { response?: { status?: number } })?.response?.status === 401
        if (isDemo && is401) {
          await authService.seedDemo()
          tokens = await authService.login({ email, password })
        } else {
          throw firstError
        }
      }
      useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token)

      const [user, gym] = await Promise.all([
        authService.getCurrentUser(),
        gymService.getCurrentGym(),
      ])

      login(user, gym, tokens.access_token, tokens.refresh_token)
      toast.success('Welcome back!')
      trackEvent('login_success', { role: user.role })
      navigate('/dashboard')
    } catch (error) {
      toast.error(getErrorMessage(error))
      trackEvent('login_failed')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
  }

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-3xl font-light text-white mb-2">
        {isDemo ? (
          <>Try <span className="font-semibold gradient-text">ActiveHQ</span></>
        ) : (
          <>Welcome <span className="font-semibold text-white">back</span></>
        )}
      </h2>
      <p className="text-slate-400 mb-8">
        {isDemo ? 'Experience the full platform with demo access' : 'Sign in to your account'}
      </p>

      {isDemo && (
        <div className="mb-8 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-emerald-300 text-sm mb-2">Demo credentials filled</p>
              <div className="text-xs text-emerald-400/70 space-y-1">
                <p><span className="text-emerald-500/50">Email:</span> {DEMO_EMAIL}</p>
                <p><span className="text-emerald-500/50">Password:</span> {DEMO_PASSWORD}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="login-email" className="block text-sm text-slate-400 mb-2">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full px-0 py-3 bg-transparent border-0 border-b border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm text-slate-400 mb-2">Password</label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full px-0 py-3 pr-10 bg-transparent border-0 border-b border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-medium hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 transition-all mt-4 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
          ) : (
            <>{isDemo ? 'Start Demo' : 'Sign in'} <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>

      {!isDemo && (
        <div className="mt-8 p-4 rounded-xl glass-light">
          <p className="text-sm text-slate-400 mb-2">Want to explore first?</p>
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="flex items-center gap-2 text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Use demo credentials
          </button>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors">
          Register your gym
        </Link>
      </p>
    </div>
  )
}
