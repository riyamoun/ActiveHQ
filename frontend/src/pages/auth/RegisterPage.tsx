import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authService, gymService } from '@/services/authService'
import { getErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    gym_name: '',
    gym_email: '',
    gym_phone: '',
    city: '',
    state: '',
    owner_name: '',
    owner_email: '',
    owner_password: '',
    confirm_password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.gym_name) newErrors.gym_name = 'Gym name is required'
    if (!formData.gym_email) newErrors.gym_email = 'Gym email is required'
    if (!formData.gym_phone) newErrors.gym_phone = 'Gym phone is required'
    if (!formData.owner_name) newErrors.owner_name = 'Your name is required'
    if (!formData.owner_email) newErrors.owner_email = 'Your email is required'
    
    if (!formData.owner_password) {
      newErrors.owner_password = 'Password is required'
    } else if (formData.owner_password.length < 8) {
      newErrors.owner_password = 'Password must be at least 8 characters'
    } else if (!/\d/.test(formData.owner_password)) {
      newErrors.owner_password = 'Password must contain at least one number'
    }
    
    if (formData.owner_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setIsLoading(true)
    
    try {
      const { confirm_password, ...registerData } = formData
      const response = await authService.register(registerData)
      
      useAuthStore.getState().setTokens(
        response.tokens.access_token,
        response.tokens.refresh_token
      )
      
      const gym = await gymService.getCurrentGym()
      
      login(
        response.user,
        gym,
        response.tokens.access_token,
        response.tokens.refresh_token
      )
      
      toast.success('Gym registered successfully!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = "w-full px-0 py-3 bg-transparent border-0 border-b border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"

  return (
    <div>
      <h2 className="text-3xl font-light text-slate-900 mb-2">
        Register your <span className="font-medium">gym</span>
      </h2>
      <p className="text-slate-500 mb-10">Start your 14-day free trial</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Gym Details */}
        <div className="space-y-5">
          <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">Gym Details</p>
          
          <div>
            <label className="block text-sm text-slate-500 mb-2">Gym Name</label>
            <input
              type="text"
              value={formData.gym_name}
              onChange={(e) => updateField('gym_name', e.target.value)}
              placeholder="FitZone Gym"
              className={inputClass}
            />
            {errors.gym_name && <p className="text-red-500 text-sm mt-1">{errors.gym_name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-2">Gym Email</label>
              <input
                type="email"
                value={formData.gym_email}
                onChange={(e) => updateField('gym_email', e.target.value)}
                placeholder="contact@gym.com"
                className={inputClass}
              />
              {errors.gym_email && <p className="text-red-500 text-sm mt-1">{errors.gym_email}</p>}
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-2">Phone</label>
              <input
                type="text"
                value={formData.gym_phone}
                onChange={(e) => updateField('gym_phone', e.target.value)}
                placeholder="9876543210"
                className={inputClass}
              />
              {errors.gym_phone && <p className="text-red-500 text-sm mt-1">{errors.gym_phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-2">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Gurgaon"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-2">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => updateField('state', e.target.value)}
                placeholder="Haryana"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Owner Details */}
        <div className="space-y-5 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">Your Details</p>
          
          <div>
            <label className="block text-sm text-slate-500 mb-2">Your Name</label>
            <input
              type="text"
              value={formData.owner_name}
              onChange={(e) => updateField('owner_name', e.target.value)}
              placeholder="Rajesh Verma"
              className={inputClass}
            />
            {errors.owner_name && <p className="text-red-500 text-sm mt-1">{errors.owner_name}</p>}
          </div>

          <div>
            <label className="block text-sm text-slate-500 mb-2">Your Email</label>
            <input
              type="email"
              value={formData.owner_email}
              onChange={(e) => updateField('owner_email', e.target.value)}
              placeholder="rajesh@example.com"
              className={inputClass}
            />
            {errors.owner_email && <p className="text-red-500 text-sm mt-1">{errors.owner_email}</p>}
          </div>

          <div>
            <label className="block text-sm text-slate-500 mb-2">Password</label>
            <input
              type="password"
              value={formData.owner_password}
              onChange={(e) => updateField('owner_password', e.target.value)}
              placeholder="Min 8 characters with numbers"
              className={inputClass}
            />
            {errors.owner_password && <p className="text-red-500 text-sm mt-1">{errors.owner_password}</p>}
          </div>

          <div>
            <label className="block text-sm text-slate-500 mb-2">Confirm Password</label>
            <input
              type="password"
              value={formData.confirm_password}
              onChange={(e) => updateField('confirm_password', e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
            {errors.confirm_password && <p className="text-red-500 text-sm mt-1">{errors.confirm_password}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-slate-900 text-white rounded-full hover:bg-emerald-600 disabled:opacity-50 transition-all"
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-10 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-slate-900 font-medium hover:text-emerald-600 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
