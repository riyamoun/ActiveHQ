import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertTriangle, ArrowRight } from 'lucide-react'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { verifyMagicLink, getErrorMessage } from '@/lib/memberApi'

export function MemberMagicLinkPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const login = useMemberAuthStore((s) => s.login)

  const [status, setStatus] = useState<'verifying' | 'error'>('verifying')
  const [error, setError] = useState('')
  const guard = useRef(false)

  const token = params.get('token') || ''

  useEffect(() => {
    if (guard.current) return
    guard.current = true

    async function run() {
      if (!token) {
        setStatus('error')
        setError('This sign-in link is incomplete. Please request a new one.')
        return
      }
      try {
        const result = await verifyMagicLink(token)
        if (result.token) {
          login(result.token.member, result.token.access_token)
          navigate('/m', { replace: true })
          return
        }
        if (result.choices && result.choices.length > 0) {
          sessionStorage.setItem('member_gym_choices', JSON.stringify(result.choices))
          navigate('/m/select-gym', { replace: true })
          return
        }
        setStatus('error')
        setError('Something went wrong. Please request a new link.')
      } catch (err) {
        setStatus('error')
        setError(getErrorMessage(err))
      }
    }
    void run()
  }, [token, login, navigate])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-5">
      <div className="max-w-sm w-full text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="w-10 h-10 text-lime-400 animate-spin mx-auto mb-5" />
            <h1 className="text-2xl font-bold mb-2">Signing you in…</h1>
            <p className="text-sm text-white/60">Just a moment.</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/40 mx-auto flex items-center justify-center mb-5">
              <AlertTriangle className="w-6 h-6 text-rose-300" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Link didn't work</h1>
            <p className="text-sm text-white/60 mb-8">{error}</p>
            <button
              type="button"
              onClick={() => navigate('/m/login', { replace: true })}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-lime-400 text-black font-bold hover:bg-lime-300 transition-colors"
            >
              Try signing in again
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
