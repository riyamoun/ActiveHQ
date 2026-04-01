import { useState, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Upload, Users, Calendar, CreditCard, ClipboardList, Package,
  CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight, FileSpreadsheet,
  RefreshCw, Wifi, WifiOff, Activity,
} from 'lucide-react'
import { migrationService, type ImportResult, type ReconciliationReport, type BiometricSyncOverview } from '@/services/migrationService'
import { getErrorMessage } from '@/lib/api'

type Step = 'members' | 'plans' | 'memberships' | 'payments' | 'attendance' | 'reconciliation'

const STEPS: { key: Step; label: string; icon: typeof Users; description: string }[] = [
  { key: 'members', label: 'Members', icon: Users, description: 'Import member list from your old system' },
  { key: 'plans', label: 'Plans', icon: Package, description: 'Import membership plans (monthly, quarterly, etc.)' },
  { key: 'memberships', label: 'Memberships', icon: ClipboardList, description: 'Link members to plans with dates and balances' },
  { key: 'payments', label: 'Payments', icon: CreditCard, description: 'Import historical payment records' },
  { key: 'attendance', label: 'Attendance', icon: Calendar, description: 'Import attendance logs from devices or old software' },
  { key: 'reconciliation', label: 'Verify', icon: CheckCircle2, description: 'Cross-check totals before cutover' },
]

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] || '' })
    return row
  })
}

function ResultCard({ result, label }: { result: ImportResult; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">{label} Import Result</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Received" value={result.total_received} />
        <Stat label="Created" value={result.created} color="text-emerald-600" />
        <Stat label="Skipped" value={(result.skipped_duplicates ?? 0) + (result.skipped_unknown_member ?? 0) + (result.skipped_duplicate ?? 0) + (result.skipped ?? 0) + (result.updated ?? 0)} color="text-amber-600" />
        <Stat label="Errors" value={result.errors.length} color={result.errors.length > 0 ? 'text-red-600' : 'text-slate-500'} />
      </div>
      {result.errors.length > 0 && (
        <div className="bg-red-50 rounded-lg p-4 max-h-40 overflow-y-auto">
          <p className="text-sm font-medium text-red-700 mb-2">Errors:</p>
          {result.errors.slice(0, 20).map((e, i) => (
            <p key={i} className="text-xs text-red-600">{e}</p>
          ))}
          {result.errors.length > 20 && <p className="text-xs text-red-500 mt-1">...and {result.errors.length - 20} more</p>}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color = 'text-slate-900' }: { label: string; value: number; color?: string }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  )
}

function CSVUploadArea({ onData, sampleHeaders, sampleRow }: {
  onData: (rows: Record<string, string>[]) => void
  sampleHeaders: string
  sampleRow: string
}) {
  const [dragActive, setDragActive] = useState(false)

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = parseCSV(text)
      onData(rows)
    }
    reader.readAsText(file)
  }, [onData])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragActive ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.csv,.txt'
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) handleFile(file)
          }
          input.click()
        }}
      >
        <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-700">Drop a CSV file here, or click to browse</p>
        <p className="text-xs text-slate-400 mt-1">UTF-8 encoded, comma-separated</p>
      </div>

      <div className="bg-slate-50 rounded-lg p-4">
        <p className="text-xs font-medium text-slate-500 mb-2">Expected CSV format:</p>
        <pre className="text-xs text-slate-600 overflow-x-auto whitespace-pre">
{sampleHeaders}
{sampleRow}
        </pre>
      </div>
    </div>
  )
}

function ReconciliationView() {
  const [days, setDays] = useState(30)
  const { data, isLoading, refetch } = useQuery<ReconciliationReport>({
    queryKey: ['reconciliation', days],
    queryFn: () => migrationService.getReconciliation(days),
  })

  const { data: syncData } = useQuery<BiometricSyncOverview>({
    queryKey: ['biometric-sync'],
    queryFn: () => migrationService.getBiometricSync(),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last 365 days</option>
        </select>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading reconciliation data...</div>
      ) : data ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <ReconCard label="Total Members" value={data.total_members} />
          <ReconCard label="Active Members" value={data.active_members} color="text-emerald-600" />
          <ReconCard label="Active Memberships" value={data.active_memberships} color="text-emerald-600" />
          <ReconCard label="Attendance Punches" value={data.total_attendance_punches} sub={`last ${data.period_days}d`} />
          <ReconCard label="Payments" value={data.total_payments} sub={`last ${data.period_days}d`} />
          <ReconCard label="Revenue" value={data.total_revenue} prefix="₹" />
          <ReconCard label="Unmapped Device Users" value={data.unmapped_device_users} color={data.unmapped_device_users > 0 ? 'text-amber-600' : 'text-emerald-600'} />
          <ReconCard label="Biometric Conflicts" value={data.biometric_conflicts} color={data.biometric_conflicts > 0 ? 'text-red-600' : 'text-emerald-600'} />
        </div>
      ) : null}

      {syncData && syncData.total_devices > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" /> Biometric Devices
          </h3>
          <div className="divide-y divide-slate-100">
            {syncData.devices.map(dev => (
              <div key={dev.device_id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {dev.is_active ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-slate-400" />}
                  <div>
                    <p className="text-sm font-medium text-slate-900">{dev.device_name}</p>
                    <p className="text-xs text-slate-400">{dev.vendor} &middot; {dev.mapped_members} mapped members</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-700">{dev.events_last_24h} events (24h)</p>
                  <p className="text-xs text-slate-400">{dev.total_events.toLocaleString()} total</p>
                  {dev.conflict_events > 0 && (
                    <p className="text-xs text-amber-600">{dev.conflict_events} conflicts</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ReconCard({ label, value, prefix, sub, color = 'text-slate-900' }: {
  label: string; value: number; prefix?: string; sub?: string; color?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className={`text-2xl font-bold ${color}`}>{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
    </div>
  )
}

export default function ImportDataPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<Step>('members')
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([])
  const [lastResult, setLastResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  const currentIdx = STEPS.findIndex(s => s.key === currentStep)

  const importMutation = useMutation({
    mutationFn: async () => {
      setError('')
      setLastResult(null)
      if (csvRows.length === 0) throw new Error('No data loaded. Upload a CSV first.')

      switch (currentStep) {
        case 'members':
          return migrationService.importMembers({
            members: csvRows.map(r => ({
              name: r.name || '',
              phone: r.phone || '',
              email: r.email || undefined,
              gender: (['male', 'female', 'other'].includes(r.gender) ? r.gender : undefined) as 'male' | 'female' | 'other' | undefined,
              date_of_birth: r.date_of_birth || undefined,
              address: r.address || undefined,
              joined_date: r.joined_date || undefined,
              member_code: r.member_code || r.device_user_id || undefined,
              notes: r.notes || undefined,
            })),
            skip_duplicates: true,
          })

        case 'plans':
          return migrationService.importPlans({
            plans: csvRows.map(r => ({
              name: r.name || '',
              duration_days: parseInt(r.duration_days) || 30,
              price: parseFloat(r.price) || 0,
              description: r.description || undefined,
            })),
          })

        case 'memberships':
          return migrationService.importMemberships({
            memberships: csvRows.map(r => ({
              member_phone: r.member_phone || r.phone || '',
              plan_name: r.plan_name || r.plan || '',
              start_date: r.start_date || '',
              end_date: r.end_date || '',
              amount_total: parseFloat(r.amount_total || r.total) || 0,
              amount_paid: parseFloat(r.amount_paid || r.paid) || 0,
              status: (['active', 'expired', 'paused', 'cancelled'].includes(r.status) ? r.status : 'active') as 'active',
            })),
          })

        case 'payments':
          return migrationService.importPayments({
            payments: csvRows.map(r => ({
              member_phone: r.member_phone || r.phone || '',
              amount: parseFloat(r.amount) || 0,
              payment_date: r.payment_date || r.date || '',
              payment_mode: (['cash', 'upi', 'card', 'bank_transfer', 'other'].includes(r.payment_mode || r.mode) ? (r.payment_mode || r.mode) : 'cash') as 'cash',
              reference_number: r.reference_number || undefined,
              notes: r.notes || undefined,
            })),
          })

        case 'attendance':
          return migrationService.importAttendance({
            records: csvRows.map(r => ({
              person_identifier: r.person_identifier || r.device_user_id || r.member_code || r.user_id || '',
              timestamp: r.timestamp || r.punch_time || r.time || '',
              punch_type: (['check_in', 'check_out'].includes(r.punch_type || r.type) ? (r.punch_type || r.type) : 'unknown') as 'unknown',
            })),
            source_label: 'csv_import',
          })

        default:
          throw new Error('Invalid step')
      }
    },
    onSuccess: (result) => setLastResult(result),
    onError: (err) => setError(getErrorMessage(err)),
  })

  const sampleData: Record<Step, { headers: string; row: string }> = {
    members: {
      headers: 'name,phone,email,gender,joined_date,member_code',
      row: 'Rajesh Kumar,9876543210,rajesh@email.com,male,2025-01-15,101',
    },
    plans: {
      headers: 'name,duration_days,price,description',
      row: 'Monthly,30,1500,Monthly gym access',
    },
    memberships: {
      headers: 'member_phone,plan_name,start_date,end_date,amount_total,amount_paid,status',
      row: '9876543210,Monthly,2026-03-01,2026-03-31,1500,1500,active',
    },
    payments: {
      headers: 'member_phone,amount,payment_date,payment_mode,notes',
      row: '9876543210,1500,2026-03-01,upi,Monthly fee',
    },
    attendance: {
      headers: 'person_identifier,timestamp,punch_type',
      row: '101,2026-03-30T09:10:00,check_in',
    },
    reconciliation: { headers: '', row: '' },
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/settings')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Import Data</h1>
          <p className="text-sm text-slate-500">Migrate your gym data from old software — zero data loss</p>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {STEPS.map((step, idx) => {
          const isCurrent = step.key === currentStep
          const isPast = idx < currentIdx
          return (
            <button
              key={step.key}
              onClick={() => { setCsvRows([]); setLastResult(null); setError(''); setCurrentStep(step.key) }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                isCurrent ? 'bg-emerald-600 text-white' : isPast ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              <step.icon className="w-4 h-4" />
              {step.label}
            </button>
          )
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            {(() => { const S = STEPS[currentIdx]; return <><S.icon className="w-5 h-5 text-emerald-600" /> {S.label}</> })()}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{STEPS[currentIdx].description}</p>
        </div>

        {currentStep === 'reconciliation' ? (
          <ReconciliationView />
        ) : (
          <>
            <CSVUploadArea
              onData={(rows) => { setCsvRows(rows); setLastResult(null); setError('') }}
              sampleHeaders={sampleData[currentStep].headers}
              sampleRow={sampleData[currentStep].row}
            />

            {csvRows.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">{csvRows.length} rows loaded from CSV</p>
                  <button
                    onClick={() => importMutation.mutate()}
                    disabled={importMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    {importMutation.isPending ? 'Importing...' : `Import ${csvRows.length} records`}
                  </button>
                </div>

                {/* Preview */}
                <div className="bg-slate-50 rounded-lg p-4 overflow-x-auto max-h-48">
                  <table className="text-xs text-slate-600 w-full">
                    <thead>
                      <tr>{Object.keys(csvRows[0]).map(h => <th key={h} className="text-left px-2 py-1 font-medium text-slate-500">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(0, 5).map((row, i) => (
                        <tr key={i}>{Object.values(row).map((v, j) => <td key={j} className="px-2 py-1 truncate max-w-[150px]">{v}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                  {csvRows.length > 5 && <p className="text-xs text-slate-400 mt-2">...and {csvRows.length - 5} more rows</p>}
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {lastResult && <ResultCard result={lastResult} label={STEPS[currentIdx].label} />}
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => { if (currentIdx > 0) { setCurrentStep(STEPS[currentIdx - 1].key); setCsvRows([]); setLastResult(null); setError('') } }}
          disabled={currentIdx === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>
        <button
          onClick={() => { if (currentIdx < STEPS.length - 1) { setCurrentStep(STEPS[currentIdx + 1].key); setCsvRows([]); setLastResult(null); setError('') } }}
          disabled={currentIdx === STEPS.length - 1}
          className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:text-emerald-700 disabled:opacity-30 transition-colors"
        >
          Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
