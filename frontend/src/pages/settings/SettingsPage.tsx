import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { gymService, authService } from '@/services/authService'
import { getErrorMessage } from '@/lib/api'
import Card, { CardHeader } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { gym, user, setGym } = useAuthStore()

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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your gym and account settings</p>
      </div>

      {/* Subscription Status */}
      <Card>
        <CardHeader title="Subscription" subtitle="Your current plan status" />
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">
              {gym?.subscription_status === 'trial' ? 'Free Trial' : 'Active Subscription'}
            </p>
            {gym?.subscription_end && (
              <p className="text-sm text-gray-500">
                Expires: {new Date(gym.subscription_end).toLocaleDateString()}
              </p>
            )}
          </div>
          <Badge
            variant={gym?.subscription_status === 'active' ? 'success' : 'warning'}
          >
            {gym?.subscription_status?.toUpperCase()}
          </Badge>
        </div>
      </Card>

      {/* Gym Details */}
      <Card>
        <CardHeader title="Gym Details" subtitle="Update your gym information" />
        <form onSubmit={handleGymSubmit} className="space-y-4">
          <Input
            label="Gym Name"
            value={gymForm.name}
            onChange={(e) => setGymForm({ ...gymForm, name: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={gymForm.phone}
              onChange={(e) => setGymForm({ ...gymForm, phone: e.target.value })}
            />
            <Input
              label="GST Number"
              value={gymForm.gst_number}
              onChange={(e) => setGymForm({ ...gymForm, gst_number: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <Input
            label="Address"
            value={gymForm.address}
            onChange={(e) => setGymForm({ ...gymForm, address: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="City"
              value={gymForm.city}
              onChange={(e) => setGymForm({ ...gymForm, city: e.target.value })}
            />
            <Input
              label="State"
              value={gymForm.state}
              onChange={(e) => setGymForm({ ...gymForm, state: e.target.value })}
            />
            <Input
              label="Pincode"
              value={gymForm.pincode}
              onChange={(e) => setGymForm({ ...gymForm, pincode: e.target.value })}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              variant="primary"
              isLoading={updateGymMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader title="Change Password" subtitle="Update your account password" />
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
            }
          />

          <Input
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, newPassword: e.target.value })
            }
            helperText="Minimum 8 characters with at least one number"
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
            }
          />

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              variant="primary"
              isLoading={changePasswordMutation.isPending}
            >
              Change Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader title="Account" subtitle="Your account information" />
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Name</span>
            <span className="font-medium text-gray-900">{user?.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-900">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Role</span>
            <Badge variant="info">{user?.role?.toUpperCase()}</Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}
