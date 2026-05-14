import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { planService } from '@/services/planService'
import { getErrorMessage } from '@/lib/api'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { Plus, Edit, Trash2, Layers } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Plan, PlanCreate } from '@/types'

const cardDark =
  '!bg-slate-900/60 !rounded-2xl !border-slate-800/60 !shadow-none border'

const primaryBtn =
  '!rounded-xl !bg-emerald-600 !text-white hover:!bg-emerald-500 focus:!ring-emerald-500 shadow-lg shadow-emerald-500/20'

const secondaryBtn =
  '!rounded-xl !bg-slate-800/60 !text-slate-200 hover:!bg-slate-800/30 focus:!ring-slate-600'

const ghostBtn =
  '!rounded-xl !text-slate-400 hover:!bg-slate-800/30 focus:!ring-slate-600'

const inputDark = '!bg-slate-900/60 !border-slate-800/60 !text-white placeholder:!text-slate-500'

export default function PlansPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => planService.getPlans(true),
  })

  const deleteMutation = useMutation({
    mutationFn: planService.deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Plan deactivated')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDuration = (days: number) => {
    if (days === 30) return '1 Month'
    if (days === 90) return '3 Months'
    if (days === 180) return '6 Months'
    if (days === 365) return '1 Year'
    return `${days} Days`
  }

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Plans</h1>
            <p className="text-slate-400">Manage your membership plans</p>
          </div>
        </div>
        <Button
          variant="primary"
          className={primaryBtn}
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setEditingPlan(null)
            setShowModal(true)
          }}
        >
          Add Plan
        </Button>
      </div>

      {/* Plans Grid */}
      {!plans?.length ? (
        <div className="rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/40 p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
            <Plus className="h-6 w-6 text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-white">No plans yet</h3>
          <p className="mt-1 text-sm text-slate-400">
            Create your first membership plan so you can start enrolling members.
          </p>
          <Button
            variant="primary"
            className={`${primaryBtn} mt-6`}
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingPlan(null)
              setShowModal(true)
            }}
          >
            Create your first plan
          </Button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${cardDark}`}>
            {!plan.is_active && (
              <div className="absolute top-4 right-4">
                <Badge
                  variant="gray"
                  className="!rounded-xl bg-slate-800/60 text-slate-400 border border-slate-800/60"
                >
                  Inactive
                </Badge>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                {plan.description && (
                  <p className="text-sm text-slate-400 mt-1">{plan.description}</p>
                )}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">
                  {formatCurrency(plan.price)}
                </span>
                <span className="text-slate-400">/ {formatDuration(plan.duration_days)}</span>
              </div>

              <div className="pt-4 border-t border-slate-800/60 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className={secondaryBtn}
                  leftIcon={<Edit className="w-4 h-4" />}
                  onClick={() => {
                    setEditingPlan(plan)
                    setShowModal(true)
                  }}
                >
                  Edit
                </Button>
                {plan.is_active && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={ghostBtn}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    onClick={() => {
                      if (confirm('Are you sure you want to deactivate this plan?')) {
                        deleteMutation.mutate(plan.id)
                      }
                    }}
                  >
                    Deactivate
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}

      {/* Plan Modal */}
      <PlanModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingPlan(null)
        }}
        plan={editingPlan}
      />
    </div>
  )
}

function PlanModal({
  isOpen,
  onClose,
  plan,
}: {
  isOpen: boolean
  onClose: () => void
  plan: Plan | null
}) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<PlanCreate>({
    name: plan?.name || '',
    description: plan?.description || '',
    duration_days: plan?.duration_days || 30,
    price: plan?.price || 0,
  })

  const createMutation = useMutation({
    mutationFn: planService.createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Plan created')
      onClose()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PlanCreate> }) =>
      planService.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Plan updated')
      onClose()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  // Reset form when plan changes
  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description || '',
        duration_days: plan.duration_days,
        price: plan.price,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        duration_days: 30,
        price: 0,
      })
    }
  }, [plan])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast.error('Plan name is required')
      return
    }

    if (plan) {
      updateMutation.mutate({ id: plan.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={plan ? 'Edit Plan' : 'Create Plan'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Plan Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Monthly, Quarterly"
          className={inputDark}
        />

        <Input
          label="Description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description"
          className={inputDark}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Duration (Days)"
            type="number"
            value={formData.duration_days}
            onChange={(e) =>
              setFormData({ ...formData, duration_days: parseInt(e.target.value) || 0 })
            }
            placeholder="30"
            className={inputDark}
          />

          <Input
            label="Price (₹)"
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
            }
            placeholder="1000"
            className={inputDark}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" className={secondaryBtn} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className={primaryBtn} isLoading={isLoading}>
            {plan ? 'Update Plan' : 'Create Plan'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
