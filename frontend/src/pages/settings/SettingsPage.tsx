import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { gymService, authService } from '@/services/authService'
import { getErrorMessage } from '@/lib/api'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { Upload, Settings, Fingerprint } from 'lucide-react'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { gym, user, setGym } = useAuthStore()
  const [totpSetup, setTotpSetup] = useState<{ secret: string; provisioning_uri: string } | null>(null)
  const [totpEnableCode, setTotpEnableCode] = useState('')
  const [totpDisablePassword, setTotpDisablePassword] = useState('')
  const [totpDisableCode, setTotpDisableCode] = useState('')
  const [totpBusy, setTotpBusy] = useState(false)

  // Gym form state
  const [gymForm, setGymForm] = useState({
    name: gym?.name || '',
    phone: gym?.phone || '',
    address: gym?.address || '',
    city: gym?.city || '',
    state: gym?.state || '',
    pincode: gym?.pincode || '',
    gst_number: gym?.gst_number || '',
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const updateGymMutation = useMutation({
    mutationFn: gymService.updateGym,
    onSuccess: (updatedGym) => {
      setGym(updatedGym)
      toast.success('Gym details updated')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const handleGymSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateGymMutation.mutate(gymForm)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    changePasswordMutation.mutate()
  }

  const cardClass = 'rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6'
  const primaryBtnClass =
    'bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20 focus:ring-emerald-500'
  const inputClass = 'bg-slate-900/60 border-slate-800/60 text-white placeholder-slate-500'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center shrink-0">
          <Settings className="w-5 h-5 text-slate-300" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400">Manage your gym and account settings</p>
        </div>
      </div>

      {/* Biometric (eSSL) */}
      <div className={`${cardClass} border-emerald-500/20`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-emerald-400" />
              Biometric device (eSSL)
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Register your scanner, map device User IDs to members, run the gym PC sync agent.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/settings/biometric')}
            className={`flex items-center gap-2 px-5 py-2.5 ${primaryBtnClass} text-sm font-medium transition-colors`}
          >
            <Fingerprint className="w-4 h-4" />
            Set up biometric
          </button>
        </div>
      </div>

      {/* Data Import */}
      <div className={cardClass}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold text-white">Data Import &amp; Migration</h3>
            <p className="text-sm text-slate-400">
              Import members, plans, memberships, payments, and attendance from your old system
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/settings/import')}
            className={`flex items-center gap-2 px-5 py-2.5 ${primaryBtnClass} text-sm font-medium transition-colors`}
          >
            <Upload className="w-4 h-4" />
            Import Data
          </button>
        </div>
      </div>

      {/* Subscription Status */}
      <div className={cardClass}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Subscription</h3>
          <p className="text-sm text-slate-400 mt-0.5">Your current plan status</p>
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-800/60 rounded-lg gap-4 flex-wrap">
          <div>
            <p className="font-medium text-white">
              {gym?.subscription_status === 'trial' ? 'Free Trial' : 'Active Subscription'}
            </p>
            {gym?.subscription_end && (
              <p className="text-sm text-slate-400">
                Expires: {new Date(gym.subscription_end).toLocaleDateString()}
              </p>
            )}
          </div>
          <Badge
            variant={gym?.subscription_status === 'active' ? 'success' : 'warning'}
            className={
              gym?.subscription_status === 'active'
                ? '!bg-emerald-500/10 !text-emerald-400'
                : '!bg-amber-500/10 !text-amber-400'
            }
          >
            {gym?.subscription_status?.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Gym Details */}
      <div className={cardClass}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Gym Details</h3>
          <p className="text-sm text-slate-400 mt-0.5">Update your gym information</p>
        </div>
        <form onSubmit={handleGymSubmit} className="space-y-4">
          <Input
            label="Gym Name"
            value={gymForm.name}
            onChange={(e) => setGymForm({ ...gymForm, name: e.target.value })}
            className={inputClass}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={gymForm.phone}
              onChange={(e) => setGymForm({ ...gymForm, phone: e.target.value })}
              className={inputClass}
            />
            <Input
              label="GST Number"
              value={gymForm.gst_number}
              onChange={(e) => setGymForm({ ...gymForm, gst_number: e.target.value })}
              placeholder="Optional"
              className={inputClass}
            />
          </div>

          <Input
            label="Address"
            value={gymForm.address}
            onChange={(e) => setGymForm({ ...gymForm, address: e.target.value })}
            className={inputClass}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="City"
              value={gymForm.city}
              onChange={(e) => setGymForm({ ...gymForm, city: e.target.value })}
              className={inputClass}
            />
            <Input
              label="State"
              value={gymForm.state}
              onChange={(e) => setGymForm({ ...gymForm, state: e.target.value })}
              className={inputClass}
            />
            <Input
              label="Pincode"
              value={gymForm.pincode}
              onChange={(e) => setGymForm({ ...gymForm, pincode: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              variant="primary"
              isLoading={updateGymMutation.isPending}
              className={primaryBtnClass}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      <div className={cardClass}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Two-factor authentication</h3>
          <p className="text-sm text-slate-400 mt-0.5">Optional authenticator app</p>
        </div>
        {user?.totp_enabled ? (
          <div className="space-y-4">
            <p className="text-sm text-emerald-400">2FA is enabled.</p>
            <Input label="Password" type="password" value={totpDisablePassword} onChange={(e) => setTotpDisablePassword(e.target.value)} className={inputClass} />
            <Input label="Authenticator code" value={totpDisableCode} onChange={(e) => setTotpDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className={inputClass} />
            <Button type="button" variant="secondary" isLoading={totpBusy} onClick={async () => {
              setTotpBusy(true)
              try {
                await authService.disableTotp(totpDisablePassword, totpDisableCode)
                toast.success('2FA disabled')
                const me = await authService.getCurrentUser()
                const { accessToken, refreshToken } = useAuthStore.getState()
                if (accessToken && gym) {
                  useAuthStore.getState().login(me, gym, accessToken, refreshToken ?? '')
                }
              } catch (e) { toast.error(getErrorMessage(e)) } finally { setTotpBusy(false) }
            }}>Disable 2FA</Button>
          </div>
        ) : totpSetup ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-400 font-mono break-all">{totpSetup.secret}</p>
            <a href={totpSetup.provisioning_uri} className="text-sm text-emerald-400 hover:underline">Add to authenticator app</a>
            <Input label="Verification code" value={totpEnableCode} onChange={(e) => setTotpEnableCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className={inputClass} />
            <Button type="button" variant="primary" className={primaryBtnClass} isLoading={totpBusy} onClick={async () => {
              setTotpBusy(true)
              try {
                await authService.enableTotp(totpEnableCode)
                toast.success('2FA enabled')
                const me = await authService.getCurrentUser()
                const { accessToken, refreshToken } = useAuthStore.getState()
                if (accessToken && gym) {
                  useAuthStore.getState().login(me, gym, accessToken, refreshToken ?? '')
                }
                setTotpSetup(null)
              } catch (e) { toast.error(getErrorMessage(e)) } finally { setTotpBusy(false) }
            }}>Confirm & enable</Button>
          </div>
        ) : (
          <Button type="button" variant="primary" className={primaryBtnClass} isLoading={totpBusy} onClick={async () => {
            setTotpBusy(true)
            try { setTotpSetup(await authService.setupTotp()) } catch (e) { toast.error(getErrorMessage(e)) } finally { setTotpBusy(false) }
          }}>Set up authenticator</Button>
        )}
      </div>

      {/* Change Password */}
      <div className={cardClass}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Change Password</h3>
          <p className="text-sm text-slate-400 mt-0.5">Update your account password</p>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
            }
            className={inputClass}
          />

          <Input
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, newPassword: e.target.value })
            }
            helperText="Minimum 8 characters with at least one number"
            className={inputClass}
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
            }
            className={inputClass}
          />

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              variant="primary"
              isLoading={changePasswordMutation.isPending}
              className={primaryBtnClass}
            >
              Change Password
            </Button>
          </div>
        </form>
      </div>

      {/* Account Info */}
      <div className={cardClass}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Account</h3>
          <p className="text-sm text-slate-400 mt-0.5">Your account information</p>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-slate-800/60">
            <span className="text-slate-400">Name</span>
            <span className="font-medium text-white">{user?.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-800/60">
            <span className="text-slate-400">Email</span>
            <span className="font-medium text-white">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-400">Role</span>
            <Badge variant="info" className="!bg-sky-500/10 !text-sky-400">
              {user?.role?.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
