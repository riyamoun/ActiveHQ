import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authService, gymService } from '@/services/authService'
import { getErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

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

  return (
    <div>
      <h2 className="text-3xl font-light text-slate-900 mb-2">
        Welcome <span className="font-medium">back</span>
      </h2>
      <p className="text-slate-500 mb-10">Sign in to your account</p>

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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full px-0 py-3 bg-transparent border-0 border-b border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-slate-900 text-white rounded-full hover:bg-emerald-600 disabled:opacity-50 transition-all mt-4"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-10 text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-slate-900 font-medium hover:text-emerald-600 transition-colors">
          Register your gym
        </Link>
      </p>
    </div>
  )
}
