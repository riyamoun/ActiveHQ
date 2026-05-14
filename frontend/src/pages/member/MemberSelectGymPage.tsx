import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Building2, Loader2, MapPin } from 'lucide-react'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { selectMember, getErrorMessage, type MemberGymChoice } from '@/lib/memberApi'

export function MemberSelectGymPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const nextPath = params.get('next') || '/m'
  const login = useMemberAuthStore((s) => s.login)

  const choices = useMemo<MemberGymChoice[]>(() => {
    try {
      const raw = sessionStorage.getItem('member_gym_choices')
      return raw ? (JSON.parse(raw) as MemberGymChoice[]) : []
    } catch {
      return []
    }
  }, [])

  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (choices.length === 0) {
      navigate('/m/login', { replace: true })
    }
  }, [choices.length, navigate])

  async function pick(c: MemberGymChoice) {
    setBusyId(c.member_id)
    setError('')
    try {
      const result = await selectMember(c.selection_token, c.member_id)
      login(result.member, result.access_token)
      sessionStorage.removeItem('member_gym_choices')
      navigate(nextPath, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-5 py-10">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <p className="text-[11px] tracking-[0.25em] uppercase text-lime-400 mb-3">
            One last step
          </p>
          <h1 className="text-3xl font-bold leading-tight">
            Which gym are you{' '}
            <span className="text-lime-400">signing into?</span>
          </h1>
          <p className="mt-3 text-sm text-white/60">
            Your account is linked to {choices.length} gyms. Pick one to continue.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {choices.map((c) => (
            <button
              key={c.member_id}
              type="button"
              onClick={() => pick(c)}
              disabled={busyId !== null}
              className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-lime-400/40 hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-wait transition-all text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center flex-shrink-0">
                {busyId === c.member_id ? (
                  <Loader2 className="w-5 h-5 text-lime-400 animate-spin" />
                ) : (
                  <Building2 className="w-5 h-5 text-lime-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">{c.gym_name}</div>
                {c.gym_city && (
                  <div className="flex items-center gap-1.5 text-xs text-white/50 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {c.gym_city}
                  </div>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 flex-shrink-0" />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate('/m/login', { replace: true })}
          className="mt-8 block w-full text-center text-xs text-white/40 hover:text-white"
        >
          Sign in as someone else
        </button>
      </div>
    </div>
  )
}
