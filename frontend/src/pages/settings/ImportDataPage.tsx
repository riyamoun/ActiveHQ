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
  const rows: string[][] = []
  let current = ''
  let row: string[] = []
  let inQuotes = false

  const pushValue = () => {
    row.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'))
    current = ''
  }

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      i += 1
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      pushValue()
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1
      pushValue()
      if (row.some((value) => value.length > 0)) rows.push(row)
      row = []
    } else {
      current += char
    }
  }

  if (current.length > 0 || row.length > 0) {
    pushValue()
    if (row.some((value) => value.length > 0)) rows.push(row)
  }

  if (rows.length < 2) return []
  const headers = rows[0].map((h) => normalizeHeader(h))
  return rows.slice(1).map((values) => {
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] || '' })
    return row
  })
}

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function field(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = row[normalizeHeader(key)]
    if (value !== undefined && value.trim() !== '') return value.trim()
  }
  return ''
}

function parseMoney(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '')
  return parseFloat(cleaned) || 0
}

function normalizeDate(value: string): string | undefined {
  const raw = value.trim().replace(/^"|"$/g, '')
  if (!raw) return undefined
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(raw)) {
    const [year, month, day] = raw.split('-')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slash) {
    const [, day, month, year] = slash
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  const named = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/)
  if (named) {
    const [, day, monthName, year] = named
    const months: Record<string, string> = {
      jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03',
      apr: '04', april: '04', may: '05', jun: '06', june: '06', jul: '07', july: '07',
      aug: '08', august: '08', sep: '09', sept: '09', september: '09', oct: '10',
      october: '10', nov: '11', november: '11', dec: '12', december: '12',
    }
    const month = months[monthName.toLowerCase()]
    if (month) return `${year}-${month}-${day.padStart(2, '0')}`
  }
  return raw
}

function normalizeGender(value: string): 'male' | 'female' | 'other' | undefined {
  const gender = value.trim().toLowerCase()
  if (gender === 'male' || gender === 'm') return 'male'
  if (gender === 'female' || gender === 'f') return 'female'
  if (gender === 'other') return 'other'
  return undefined
}

function normalizeStatus(value: string): 'active' | 'expired' | 'paused' | 'cancelled' {
  const status = value.trim().toLowerCase()
  if (status === 'expired') return 'expired'
  if (status === 'paused') return 'paused'
  if (status === 'cancelled' || status === 'canceled') return 'cancelled'
  return 'active'
}

function normalizePaymentMode(value: string): 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other' {
  const mode = value.trim().toLowerCase().replace(/\s+/g, '_')
  if (mode === 'upi') return 'upi'
  if (mode === 'card' || mode === 'credit_card' || mode === 'debit_card') return 'card'
  if (mode === 'bank' || mode === 'bank_transfer' || mode === 'banktransfer') return 'bank_transfer'
  if (mode === 'cash') return 'cash'
  return mode ? 'other' : 'cash'
}

function derivePlanName(row: Record<string, string>): string {
  const explicit = field(row, ['plan_name', 'plan', 'package', 'membership_type'])
  if (explicit) return explicit
  const start = normalizeDate(field(row, ['start_date']))
  const end = normalizeDate(field(row, ['end_date']))
  if (start && end) {
    const startMs = new Date(`${start}T00:00:00`).getTime()
    const endMs = new Date(`${end}T00:00:00`).getTime()
    const days = Math.max(1, Math.round((endMs - startMs) / 86400000) + 1)
    if (days >= 360) return 'Yearly'
    if (days >= 170) return 'Half Yearly'
    if (days >= 80) return 'Quarterly'
    return 'Monthly'
  }
  return 'Imported Plan'
}

function deriveDurationDays(row: Record<string, string>, fallback = 30): number {
  const explicit = parseInt(field(row, ['duration_days', 'duration']))
  if (explicit > 0) return explicit
  const start = normalizeDate(field(row, ['start_date']))
  const end = normalizeDate(field(row, ['end_date']))
  if (start && end) {
    const startMs = new Date(`${start}T00:00:00`).getTime()
    const endMs = new Date(`${end}T00:00:00`).getTime()
    const days = Math.round((endMs - startMs) / 86400000) + 1
    if (days > 0) return days
  }
  return fallback
}

function ResultCard({ result, label }: { result: ImportResult; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 space-y-4">
      <h3 className="text-lg font-semibold text-white">{label} Import Result</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Received" value={result.total_received} />
        <Stat label="Created" value={result.created} color="text-emerald-400" />
        <Stat label="Skipped" value={(result.skipped_duplicates ?? 0) + (result.skipped_unknown_member ?? 0) + (result.skipped_duplicate ?? 0) + (result.skipped ?? 0) + (result.updated ?? 0)} color="text-amber-400" />
        <Stat label="Errors" value={result.errors.length} color={result.errors.length > 0 ? 'text-red-400' : 'text-slate-400'} />
      </div>
      {result.errors.length > 0 && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 max-h-40 overflow-y-auto">
          <p className="text-sm font-medium text-red-400 mb-2">Errors:</p>
          {result.errors.slice(0, 20).map((e, i) => (
            <p key={i} className="text-xs text-red-400">{e}</p>
          ))}
          {result.errors.length > 20 && <p className="text-xs text-red-400 mt-1">...and {result.errors.length - 20} more</p>}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color = 'text-white' }: { label: string; value: number; color?: string }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
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
          dragActive ? 'border-emerald-400 bg-emerald-500/10' : 'border-slate-800/60 hover:border-emerald-400'
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
        <p className="text-sm font-medium text-white">Drop a CSV file here, or click to browse</p>
        <p className="text-xs text-slate-400 mt-1">UTF-8 encoded, comma-separated</p>
      </div>

      <div className="bg-slate-800/40 rounded-lg p-4">
        <p className="text-xs font-medium text-slate-400 mb-2">Expected CSV format:</p>
        <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre">
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
          className="border border-slate-800/60 bg-slate-900/60 text-white rounded-lg px-3 py-2 text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last 365 days</option>
        </select>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-500 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading reconciliation data...</div>
      ) : data ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <ReconCard label="Total Members" value={data.total_members} />
          <ReconCard label="Active Members" value={data.active_members} color="text-emerald-400" />
          <ReconCard label="Active Memberships" value={data.active_memberships} color="text-emerald-400" />
          <ReconCard label="Attendance Punches" value={data.total_attendance_punches} sub={`last ${data.period_days}d`} />
          <ReconCard label="Payments" value={data.total_payments} sub={`last ${data.period_days}d`} />
          <ReconCard label="Revenue" value={data.total_revenue} prefix="₹" />
          <ReconCard label="Unmapped Device Users" value={data.unmapped_device_users} color={data.unmapped_device_users > 0 ? 'text-amber-400' : 'text-emerald-400'} />
          <ReconCard label="Biometric Conflicts" value={data.biometric_conflicts} color={data.biometric_conflicts > 0 ? 'text-red-400' : 'text-emerald-400'} />
        </div>
      ) : null}

      {syncData && syncData.total_devices > 0 && (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" /> Biometric Devices
          </h3>
          <div className="divide-y divide-slate-800/60">
            {syncData.devices.map(dev => (
              <div key={dev.device_id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {dev.is_active ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-slate-400" />}
                  <div>
                    <p className="text-sm font-medium text-white">{dev.device_name}</p>
                    <p className="text-xs text-slate-400">{dev.vendor} &middot; {dev.mapped_members} mapped members</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">{dev.events_last_24h} events (24h)</p>
                  <p className="text-xs text-slate-400">{dev.total_events.toLocaleString()} total</p>
                  {dev.conflict_events > 0 && (
                    <p className="text-xs text-amber-400">{dev.conflict_events} conflicts</p>
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

function ReconCard({ label, value, prefix, sub, color = 'text-white' }: {
  label: string; value: number; prefix?: string; sub?: string; color?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
      <p className={`text-2xl font-bold ${color}`}>{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
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
              name: field(r, ['name', 'member', 'member_name']),
              phone: field(r, ['phone', 'mobile', 'mobile_number', 'member_phone']),
              email: field(r, ['email']) || undefined,
              gender: normalizeGender(field(r, ['gender'])),
              date_of_birth: normalizeDate(field(r, ['date_of_birth', 'dob'])) || undefined,
              address: field(r, ['address']) || undefined,
              joined_date: normalizeDate(field(r, ['joined_date', 'join_date'])) || undefined,
              member_code: field(r, ['member_code', 'code', 'device_user_id']) || undefined,
              notes: field(r, ['notes']) || undefined,
            })),
            skip_duplicates: true,
          })

        case 'plans':
          return migrationService.importPlans({
            plans: csvRows.map(r => ({
              name: derivePlanName(r),
              duration_days: deriveDurationDays(r),
              price: parseMoney(field(r, ['price', 'amount', 'package_price'])),
              description: field(r, ['description']) || undefined,
            })),
          })

        case 'memberships':
          return migrationService.importMemberships({
            memberships: csvRows.map(r => ({
              member_phone: field(r, ['member_phone', 'phone', 'mobile']),
              plan_name: derivePlanName(r),
              start_date: normalizeDate(field(r, ['start_date'])) || '',
              end_date: normalizeDate(field(r, ['end_date'])) || '',
              amount_total: parseMoney(field(r, ['amount_total', 'total', 'price', 'amount'])),
              amount_paid: parseMoney(field(r, ['amount_paid', 'paid', 'price', 'amount'])),
              status: normalizeStatus(field(r, ['status', 'package_status'])),
            })),
          })

        case 'payments':
          return migrationService.importPayments({
            payments: csvRows.map(r => ({
              member_phone: field(r, ['member_phone', 'phone', 'mobile']),
              amount: parseMoney(field(r, ['amount', 'paid_amount'])),
              payment_date: normalizeDate(field(r, ['payment_date', 'date'])) || '',
              payment_mode: normalizePaymentMode(field(r, ['payment_mode', 'mode', 'method'])),
              reference_number: field(r, ['reference_number', 'reference', 'invoice']) || undefined,
              notes: field(r, ['notes', 'package']) || undefined,
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
        <button onClick={() => navigate('/settings')} className="p-2 hover:bg-slate-800/30 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Import Data</h1>
          <p className="text-sm text-slate-400">Migrate your gym data from old software — zero data loss</p>
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
                isCurrent ? 'bg-emerald-600 text-white' : isPast ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800/30'
              }`}
            >
              <step.icon className="w-4 h-4" />
              {step.label}
            </button>
          )
        })}
      </div>

      {/* Step Content */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            {(() => { const S = STEPS[currentIdx]; return <><S.icon className="w-5 h-5 text-emerald-400" /> {S.label}</> })()}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{STEPS[currentIdx].description}</p>
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
                  <p className="text-sm text-slate-400">{csvRows.length} rows loaded from CSV</p>
                  <button
                    onClick={() => importMutation.mutate()}
                    disabled={importMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    {importMutation.isPending ? 'Importing...' : `Import ${csvRows.length} records`}
                  </button>
                </div>

                {/* Preview */}
                <div className="bg-slate-800/40 rounded-lg p-4 overflow-x-auto max-h-48">
                  <table className="text-xs text-slate-400 w-full">
                    <thead>
                      <tr>{Object.keys(csvRows[0]).map(h => <th key={h} className="text-left px-2 py-1 font-medium text-slate-400">{h}</th>)}</tr>
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
              <div className="flex items-start gap-3 bg-red-950/30 border border-red-900/50 rounded-lg p-4">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
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
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>
        <button
          onClick={() => { if (currentIdx < STEPS.length - 1) { setCurrentStep(STEPS[currentIdx + 1].key); setCsvRows([]); setLastResult(null); setError('') } }}
          disabled={currentIdx === STEPS.length - 1}
          className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 hover:text-emerald-300 disabled:opacity-30 transition-colors"
        >
          Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
