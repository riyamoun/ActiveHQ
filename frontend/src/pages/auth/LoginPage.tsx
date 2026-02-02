import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authService, gymService } from '@/services/authService'
import { getErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'
import { Sparkles, Eye, EyeOff } from 'lucide-react'

// Demo credentials (from seed data)
const DEMO_EMAIL = 'owner@fitzonegym.com'
const DEMO_PASSWORD = 'Owner@123'

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

  // Auto-fill demo credentials when demo mode
  useEffect(() => {
    if (isDemo) {
      setEmail(DEMO_EMAIL)
      setPassword(DEMO_PASSWORD)
    }
  }, [isDemo])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email address'
    }
    
    if (!password) {
      newErrors.password = 'Password is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setIsLoading(true)
    
    try {
      const tokens = await authService.login({ email, password })
      useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token)
      
      const [user, gym] = await Promise.all([
        authService.getCurrentUser(),
        gymService.getCurrentGym(),
      ])
      
      login(user, gym, tokens.access_token, tokens.refresh_token)
      
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
  }

  return (
    <div>
      <h2 className="text-3xl font-light text-slate-900 mb-2">
        {isDemo ? (
          <>Try <span className="font-medium">ActiveHQ</span></>
        ) : (
          <>Welcome <span className="font-medium">back</span></>
        )}
      </h2>
      <p className="text-slate-500 mb-8">
        {isDemo ? 'Experience the full platform with demo access' : 'Sign in to your account'}
      </p>

      {/* Demo Credentials Card */}
      {isDemo && (
        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-emerald-900 text-sm mb-2">Demo credentials filled</p>
              <div className="text-xs text-emerald-700 space-y-1">
                <p><span className="text-emerald-500">Email:</span> {DEMO_EMAIL}</p>
                <p><span className="text-emerald-500">Password:</span> {DEMO_PASSWORD}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm text-slate-500 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full px-0 py-3 bg-transparent border-0 border-b border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm text-slate-500 mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full px-0 py-3 pr-10 bg-transparent border-0 border-b border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-slate-900 text-white rounded-full hover:bg-emerald-600 disabled:opacity-50 transition-all mt-4"
        >
          {isLoading ? 'Signing in...' : isDemo ? 'Start Demo' : 'Sign in'}
        </button>
      </form>

      {/* Demo access link for non-demo mode */}
      {!isDemo && (
        <div className="mt-8 p-4 bg-slate-50 rounded-xl">
          <p className="text-sm text-slate-600 mb-2">Want to explore first?</p>
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="flex items-center gap-2 text-emerald-600 text-sm font-medium hover:text-emerald-700 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Use demo credentials
          </button>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-slate-900 font-medium hover:text-emerald-600 transition-colors">
          Register your gym
        </Link>
      </p>
    </div>
  )
}
