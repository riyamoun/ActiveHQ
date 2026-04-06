import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { memberService } from '@/services/memberService'
import { getErrorMessage } from '@/lib/api'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { ArrowLeft, ImagePlus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { MemberCreate } from '@/types'

export default function AddMemberPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<MemberCreate>({
    name: '',
    phone: '',
    email: '',
    alternate_phone: '',
    gender: undefined,
    date_of_birth: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    member_code: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: memberService.createMember,
    onSuccess: async (member) => {
      if (photoFile) {
        try {
          await memberService.uploadMemberPhoto(member.id, photoFile)
        } catch (error) {
          toast.error(`Member created, but photo upload failed: ${getErrorMessage(error)}`)
        }
      }
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Member created successfully')
      navigate(`/members/${member.id}`)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const updateField = (field: string, value: string | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Invalid phone number'
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    // Clean up empty strings
    const cleanData: MemberCreate = {
      name: formData.name,
      phone: formData.phone,
    }

    if (formData.email) cleanData.email = formData.email
    if (formData.alternate_phone) cleanData.alternate_phone = formData.alternate_phone
    if (formData.gender) cleanData.gender = formData.gender
    if (formData.date_of_birth) cleanData.date_of_birth = formData.date_of_birth
    if (formData.address) cleanData.address = formData.address
    if (formData.emergency_contact_name) cleanData.emergency_contact_name = formData.emergency_contact_name
    if (formData.emergency_contact_phone) cleanData.emergency_contact_phone = formData.emergency_contact_phone
    if (formData.member_code) cleanData.member_code = formData.member_code
    if (formData.notes) cleanData.notes = formData.notes

    createMutation.mutate(cleanData)
  }

  const handlePhotoSelect = (file: File | null) => {
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error('Only JPG, PNG, or WEBP files are allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo size must be less than 5MB')
      return
    }
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
    setPhotoFile(file)
    setPhotoPreviewUrl(URL.createObjectURL(file))
  }

  const clearPhoto = () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
    setPhotoPreviewUrl(null)
    setPhotoFile(null)
  }

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
    }
  }, [photoPreviewUrl])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/members')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Add Member</h1>
          <p className="text-slate-400">Create a new gym member</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name *"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                error={errors.name}
                placeholder="Full name"
              />
              <Input
                label="Member Code"
                value={formData.member_code || ''}
                onChange={(e) => updateField('member_code', e.target.value)}
                placeholder="e.g., GYM001"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone *"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                error={errors.phone}
                placeholder="10-digit number"
              />
              <Input
                label="Alternate Phone"
                value={formData.alternate_phone || ''}
                onChange={(e) => updateField('alternate_phone', e.target.value)}
                placeholder="Optional"
              />
            </div>

            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              error={errors.email}
              placeholder="email@example.com"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Gender"
                value={formData.gender || ''}
                onChange={(e) => updateField('gender', e.target.value || undefined)}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
                placeholder="Select gender"
              />
              <Input
                label="Date of Birth"
                type="date"
                value={formData.date_of_birth || ''}
                onChange={(e) => updateField('date_of_birth', e.target.value)}
              />
            </div>

            <div className="pt-2">
              <p className="label">Profile Photo (optional)</p>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border border-slate-700 bg-slate-800/50 overflow-hidden flex items-center justify-center">
                  {photoPreviewUrl ? (
                    <img src={photoPreviewUrl} alt="Member preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImagePlus className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <div className="flex gap-2">
                  <label className="btn-secondary cursor-pointer">
                    Choose Photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)}
                    />
                  </label>
                  {photoFile && (
                    <Button type="button" variant="ghost" onClick={clearPhoto} leftIcon={<X className="w-4 h-4" />}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4 pt-4 border-t border-slate-800/60">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Address
            </h3>

            <Input
              label="Address"
              value={formData.address || ''}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Full address"
            />
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4 pt-4 border-t border-slate-800/60">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Emergency Contact
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Contact Name"
                value={formData.emergency_contact_name || ''}
                onChange={(e) => updateField('emergency_contact_name', e.target.value)}
                placeholder="Emergency contact name"
              />
              <Input
                label="Contact Phone"
                value={formData.emergency_contact_phone || ''}
                onChange={(e) => updateField('emergency_contact_phone', e.target.value)}
                placeholder="Emergency contact phone"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4 pt-4 border-t border-slate-800/60">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Notes
            </h3>

            <textarea
              className="input min-h-[100px]"
              placeholder="Any additional notes..."
              value={formData.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60">
            <Button variant="secondary" onClick={() => navigate('/members')}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending}
            >
              Create Member
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
