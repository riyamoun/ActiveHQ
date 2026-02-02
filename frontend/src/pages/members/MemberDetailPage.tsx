import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { memberService } from '@/services/memberService'
import { membershipService } from '@/services/membershipService'
import { paymentService } from '@/services/paymentService'
import { attendanceService } from '@/services/attendanceService'
import { planService } from '@/services/planService'
import { getErrorMessage } from '@/lib/api'
import Card, { CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  UserCheck,
  Plus,
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import type { MembershipStatus, PaymentMode } from '@/types'

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showMembershipModal, setShowMembershipModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Fetch member details
  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => memberService.getMember(id!),
    enabled: !!id,
  })

  // Fetch memberships
  const { data: memberships } = useQuery({
    queryKey: ['member-memberships', id],
    queryFn: () => membershipService.getMemberMemberships(id!),
    enabled: !!id,
  })

  // Fetch payments
  const { data: payments } = useQuery({
    queryKey: ['member-payments', id],
    queryFn: () => paymentService.getMemberPayments(id!),
    enabled: !!id,
  })

  // Fetch plans for membership modal
  const { data: plans } = useQuery({
    queryKey: ['plans-active'],
    queryFn: () => planService.getActivePlans(),
  })

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: () => attendanceService.checkIn(id!),
    onSuccess: () => {
      toast.success('Member checked in')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  if (memberLoading || !member) {
    return <PageLoader />
  }

  const getStatusBadge = (status: MembershipStatus | null) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>
      case 'expired':
        return <Badge variant="danger">Expired</Badge>
      case 'paused':
        return <Badge variant="warning">Paused</Badge>
      case 'cancelled':
        return <Badge variant="gray">Cancelled</Badge>
      default:
        return <Badge variant="gray">No Membership</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/members')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
            <p className="text-gray-500">{member.member_code || 'No member code'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            leftIcon={<UserCheck className="w-4 h-4" />}
            onClick={() => checkInMutation.mutate()}
            isLoading={checkInMutation.isPending}
          >
            Check In
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowMembershipModal(true)}
          >
            Add Membership
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Info */}
        <Card>
          <CardHeader title="Member Details" />
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-700">
                  {member.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                {getStatusBadge(member.current_membership_status)}
                {member.current_plan_name && (
                  <p className="text-sm text-gray-500 mt-1">{member.current_plan_name}</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{member.phone}</span>
              </div>
              {member.email && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{member.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Joined {format(new Date(member.joined_date), 'dd MMM yyyy')}</span>
              </div>
            </div>

            {member.current_membership_end && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">Membership expires</p>
                <p className="font-semibold text-gray-900">
                  {format(new Date(member.current_membership_end), 'dd MMM yyyy')}
                </p>
              </div>
            )}

            {member.amount_due !== null && member.amount_due > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">Amount Due</p>
                <p className="font-semibold text-red-600">
                  {formatCurrency(member.amount_due)}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowPaymentModal(true)}
                >
                  Record Payment
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Memberships */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Membership History"
            subtitle={`${memberships?.length || 0} memberships`}
          />
          
          <div className="space-y-3">
            {memberships?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No memberships yet</p>
            ) : (
              memberships?.map((membership) => (
                <div
                  key={membership.id}
                  className="p-4 bg-gray-50 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">{membership.plan_name}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(membership.start_date), 'dd MMM yyyy')} -{' '}
                      {format(new Date(membership.end_date), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(membership.status)}
                    {membership.amount_due > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        Due: {formatCurrency(membership.amount_due)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Payments */}
      <Card>
        <CardHeader
          title="Payment History"
          subtitle={`${payments?.length || 0} payments`}
          action={
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowPaymentModal(true)}
            >
              Add Payment
            </Button>
          }
        />
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Mode
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">
                    No payments yet
                  </td>
                </tr>
              ) : (
                payments?.map((payment) => (
                  <tr key={payment.id}>
                    <td className="py-3 px-4">
                      {format(new Date(payment.payment_date), 'dd MMM yyyy')}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="info">{payment.payment_mode.toUpperCase()}</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {payment.reference_number || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Membership Modal */}
      <AddMembershipModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        memberId={id!}
        plans={plans || []}
      />

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        memberId={id!}
        currentMembershipId={memberships?.[0]?.id}
      />
    </div>
  )
}

// Add Membership Modal Component
function AddMembershipModal({
  isOpen,
  onClose,
  memberId,
  plans,
}: {
  isOpen: boolean
  onClose: () => void
  memberId: string
  plans: { id: string; name: string; price: number; duration_days: number }[]
}) {
  const queryClient = useQueryClient()
  const [planId, setPlanId] = useState('')
  const [amountPaid, setAmountPaid] = useState('')

  const createMutation = useMutation({
    mutationFn: membershipService.createMembership,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', memberId] })
      queryClient.invalidateQueries({ queryKey: ['member-memberships', memberId] })
      toast.success('Membership created')
      onClose()
      setPlanId('')
      setAmountPaid('')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const selectedPlan = plans.find((p) => p.id === planId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!planId) {
      toast.error('Please select a plan')
      return
    }

    createMutation.mutate({
      member_id: memberId,
      plan_id: planId,
      amount_paid: amountPaid ? parseFloat(amountPaid) : 0,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Membership">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Plan"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          options={plans.map((p) => ({
            value: p.id,
            label: `${p.name} - ₹${p.price} (${p.duration_days} days)`,
          }))}
          placeholder="Select a plan"
        />

        {selectedPlan && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Plan Price</p>
            <p className="text-xl font-bold text-gray-900">₹{selectedPlan.price}</p>
          </div>
        )}

        <Input
          label="Amount Paid Now"
          type="number"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          placeholder="0"
          helperText="Leave empty or 0 if full amount will be paid later"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
            Create Membership
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// Add Payment Modal Component
function AddPaymentModal({
  isOpen,
  onClose,
  memberId,
  currentMembershipId,
}: {
  isOpen: boolean
  onClose: () => void
  memberId: string
  currentMembershipId?: string
}) {
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash')
  const [referenceNumber, setReferenceNumber] = useState('')

  const createMutation = useMutation({
    mutationFn: paymentService.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', memberId] })
      queryClient.invalidateQueries({ queryKey: ['member-payments', memberId] })
      queryClient.invalidateQueries({ queryKey: ['member-memberships', memberId] })
      toast.success('Payment recorded')
      onClose()
      setAmount('')
      setPaymentMode('cash')
      setReferenceNumber('')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    createMutation.mutate({
      member_id: memberId,
      membership_id: currentMembershipId,
      amount: parseFloat(amount),
      payment_mode: paymentMode,
      reference_number: referenceNumber || undefined,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />

        <Select
          label="Payment Mode"
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
          options={[
            { value: 'cash', label: 'Cash' },
            { value: 'upi', label: 'UPI' },
            { value: 'card', label: 'Card' },
            { value: 'bank_transfer', label: 'Bank Transfer' },
            { value: 'other', label: 'Other' },
          ]}
        />

        {paymentMode !== 'cash' && (
          <Input
            label="Reference Number"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="Transaction ID / UPI Ref"
          />
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  )
}
