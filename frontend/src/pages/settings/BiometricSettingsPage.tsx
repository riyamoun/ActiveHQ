import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Fingerprint,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Wifi,
  AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  biometricService,
  buildAgentEnvBlock,
  type BiometricDevice,
  type DeviceVendor,
} from '@/services/biometricService'
import { migrationService } from '@/services/migrationService'
import { memberService } from '@/services/memberService'
import { getErrorMessage } from '@/lib/api'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'

const DEFAULT_DEVICE: {
  name: string
  vendor: DeviceVendor
  external_device_id: string
  device_ip: string
  device_port: string
} = {
  name: 'Main gate eSSL',
  vendor: 'essl',
  external_device_id: 'essl-main-1',
  device_ip: '192.168.1.11',
  device_port: '4370',
}

export default function BiometricSettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState(DEFAULT_DEVICE)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [ingestToken, setIngestToken] = useState<string | null>(null)
  const [mapMemberId, setMapMemberId] = useState('')
  const [mapDeviceUserId, setMapDeviceUserId] = useState('')

  const devicesQuery = useQuery({
    queryKey: ['biometric-devices'],
    queryFn: () => biometricService.listDevices(),
  })

  const syncQuery = useQuery({
    queryKey: ['biometric-sync'],
    queryFn: () => migrationService.getBiometricSync(),
    refetchInterval: 30_000,
  })

  const selectedDevice: BiometricDevice | undefined = useMemo(() => {
    const list = devicesQuery.data || []
    if (selectedDeviceId) return list.find((d) => d.id === selectedDeviceId)
    return list[0]
  }, [devicesQuery.data, selectedDeviceId])

  const mappingsQuery = useQuery({
    queryKey: ['biometric-mappings', selectedDevice?.id],
    queryFn: () => biometricService.listMappings(selectedDevice!.id),
    enabled: !!selectedDevice?.id,
  })

  const membersQuery = useQuery({
    queryKey: ['members-list-bio'],
    queryFn: () => memberService.getMembers({ page: 1, page_size: 500 }),
  })

  const createDeviceMutation = useMutation({
    mutationFn: () =>
      biometricService.createDevice({
        name: form.name,
        vendor: form.vendor,
        external_device_id: form.external_device_id,
        location_label: 'Main entrance',
      }),
    onSuccess: (device) => {
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] })
      setSelectedDeviceId(device.id)
      toast.success('Device registered in ActiveHQ')
      setStep(2)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const tokenMutation = useMutation({
    mutationFn: (deviceId: string) => biometricService.rotateToken(deviceId),
    onSuccess: (data) => {
      setIngestToken(data.ingest_token)
      queryClient.invalidateQueries({ queryKey: ['biometric-devices'] })
      toast.success('Ingest token generated — copy it now (shown once)')
      setStep(3)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const mapMutation = useMutation({
    mutationFn: () =>
      biometricService.upsertMapping({
        device_id: selectedDevice!.id,
        member_id: mapMemberId,
        device_user_id: mapDeviceUserId.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-mappings'] })
      queryClient.invalidateQueries({ queryKey: ['biometric-sync'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setMapDeviceUserId('')
      setMapMemberId('')
      toast.success('Member linked to device User ID')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const deleteMapMutation = useMutation({
    mutationFn: (id: string) => biometricService.deleteMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-mappings'] })
      queryClient.invalidateQueries({ queryKey: ['biometric-sync'] })
      toast.success('Mapping removed')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const agentScript = ingestToken
    ? buildAgentEnvBlock({
        deviceIp: form.device_ip,
        devicePort: form.device_port,
        externalDeviceId: selectedDevice?.external_device_id || form.external_device_id,
        ingestToken,
      })
    : ''

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied`)
    } catch {
      toast.error('Could not copy — select and copy manually')
    }
  }

  const cardClass = 'rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6'

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Fingerprint className="w-6 h-6 text-emerald-400" />
            Biometric (eSSL)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Connect your face/fingerprint device so check-ins appear on the dashboard automatically.
          </p>
        </div>
      </div>

      {/* Live status */}
      {syncQuery.data && syncQuery.data.total_devices > 0 && (
        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-4">
            <Wifi className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-white">Sync status</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Devices" value={syncQuery.data.total_devices} />
            <Stat label="Mapped members" value={syncQuery.data.total_mapped_members} />
            <Stat label="Active" value={syncQuery.data.active_devices} />
            <Stat
              label="Last event"
              value={
                syncQuery.data.last_event_at
                  ? new Date(syncQuery.data.last_event_at).toLocaleTimeString('en-IN', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : '—'
              }
            />
          </div>
        </div>
      )}

      {/* Step pills */}
      <div>
        {[
          { n: 1, label: 'Register device' },
          { n: 2, label: 'API token' },
          { n: 3, label: 'Gym PC agent' },
          { n: 4, label: 'Map members' },
        ].map((s) => (
          <button
            key={s.n}
            type="button"
            onClick={() => setStep(s.n)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              step === s.n
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {s.n}. {s.label}
          </button>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-white mb-1">1. Register your eSSL device</h2>
          <p className="text-sm text-slate-400 mb-6">
            From your device screen: Ethernet → note IP and port (usually <strong className="text-white">4370</strong>).
            Your photos show <strong className="text-white">192.168.1.11</strong> — use that below for the gym PC agent.
          </p>

          {devicesQuery.data && devicesQuery.data.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Already registered</p>
              {devicesQuery.data.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setSelectedDeviceId(d.id)
                    setStep(2)
                  }}
                  className="w-full text-left flex items-center justify-between py-2 text-sm text-white hover:text-emerald-300"
                >
                  <span>{d.name}</span>
                  <span className="text-slate-500">{d.external_device_id}</span>
                </button>
              ))}
            </div>
          )}

          <div>
            <Input
              label="Device name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-slate-900/60 border-slate-800/60 text-white"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Vendor"
                value={form.vendor}
                onChange={(e) =>
                  setForm({ ...form, vendor: e.target.value as DeviceVendor })
                }
                options={[
                  { value: 'essl', label: 'eSSL / ZKTeco' },
                  { value: 'generic', label: 'Generic' },
                ]}
              />
              <Input
                label="Device ID (for API)"
                value={form.external_device_id}
                onChange={(e) => setForm({ ...form, external_device_id: e.target.value })}
                helperText="Must match EXTERNAL_DEVICE_ID in the agent"
                className="bg-slate-900/60 border-slate-800/60 text-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Device LAN IP"
                value={form.device_ip}
                onChange={(e) => setForm({ ...form, device_ip: e.target.value })}
                placeholder="192.168.1.11"
                className="bg-slate-900/60 border-slate-800/60 text-white"
              />
              <Input
                label="TCP port"
                value={form.device_port}
                onChange={(e) => setForm({ ...form, device_port: e.target.value })}
                placeholder="4370"
                className="bg-slate-900/60 border-slate-800/60 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              variant="primary"
              isLoading={createDeviceMutation.isPending}
              onClick={() => createDeviceMutation.mutate()}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              Save device &amp; continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-white mb-1">2. Generate ingest token</h2>
          <p className="text-sm text-slate-400 mb-6">
            The gym PC agent uses this token to push attendance to ActiveHQ securely.
          </p>

          {!selectedDevice && (
            <div>
              <AlertTriangle className="w-4 h-4" />
              Complete step 1 first, or pick a device above.
            </div>
          )}

          {selectedDevice && (
            <div>
              <div className="text-slate-400">Device</div>
              <div>{selectedDevice.name}</div>
              <div>{selectedDevice.external_device_id}</div>
              {selectedDevice.has_ingest_token && (
                <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Token exists — generate a new one if you lost it
                </p>
              )}
            </div>
          )}

          <Button
            variant="primary"
            disabled={!selectedDevice}
            isLoading={tokenMutation.isPending}
            onClick={() => selectedDevice && tokenMutation.mutate(selectedDevice.id)}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            Generate new token
          </Button>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-white mb-1">3. Run agent on gym PC</h2>
          <p className="text-sm text-slate-400 mb-4">
            Install on a Windows PC on the <strong className="text-white">same Wi‑Fi</strong> as the device.
            The device cannot reach the cloud directly — the PC polls it and forwards punches.
          </p>

          {!ingestToken && (
            <div>
              Generate a token in step 2 first.
            </div>
          )}

          {ingestToken && (
            <>
              <div className="relative">
                <pre className="text-xs text-slate-300 bg-black/40 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap border border-slate-800">
                  {agentScript}
                </pre>
                <button
                  type="button"
                  onClick={() => copyText(agentScript, 'Agent commands')}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                From repo folder: <code className="text-slate-400">cd backend</code> then run the commands.
                See <code className="text-slate-400">DOMAIN-AND-INTEGRATIONS-RUNBOOK.md</code> for full steps.
              </p>
            </>
          )}

          <div className="flex justify-end mt-6">
            <Button variant="primary" onClick={() => setStep(4)} className="bg-emerald-600">
              Continue to member mapping
            </Button>
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && selectedDevice && (
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-white mb-1">4. Map device User ID → member</h2>
          <p className="text-sm text-slate-400 mb-6">
            When RIYA checks in, the device shows <strong className="text-white">User ID: 4</strong>.
            Link that number to the member in ActiveHQ (we also set their Member Code).
          </p>

          <div>
            <div className="sm:col-span-2">
              <Select
                label="Member"
                value={mapMemberId}
                onChange={(e) => setMapMemberId(e.target.value)}
                options={[
                  { value: '', label: 'Select member…' },
                  ...(membersQuery.data?.items || []).map((m) => ({
                    value: m.id,
                    label: `${m.name} · ${m.phone}${m.member_code ? ` · code ${m.member_code}` : ''}`,
                  })),
                ]}
              />
            </div>
            <Input
              label="Device User ID"
              value={mapDeviceUserId}
              onChange={(e) => setMapDeviceUserId(e.target.value)}
              placeholder="e.g. 4"
              className="bg-slate-900/60 border-slate-800/60 text-white"
            />
          </div>
          <Button
            variant="primary"
            disabled={!mapMemberId || !mapDeviceUserId.trim()}
            isLoading={mapMutation.isPending}
            onClick={() => mapMutation.mutate()}
            className="mb-6 bg-emerald-600"
          >
            <Plus className="w-4 h-4 mr-1" /> Add mapping
          </Button>

          {mappingsQuery.isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          ) : (
            <ul className="space-y-2">
              {(mappingsQuery.data || []).length === 0 ? (
                <li className="text-sm text-slate-500 py-4 text-center border border-dashed border-slate-700 rounded-xl">
                  No mappings yet. Add one for each person on the device.
                </li>
              ) : (
                mappingsQuery.data!.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50"
                  >
                    <div>
                      <span className="text-emerald-400 font-mono font-bold mr-2">
                        ID {row.device_user_id}
                      </span>
                      <span className="text-white">{row.member_name}</span>
                      <span className="text-slate-500 text-xs ml-2">{row.member_phone}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteMapMutation.mutate(row.id)}
                      className="p-2 text-slate-500 hover:text-red-400"
                      aria-label="Remove mapping"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/attendance"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500"
            >
              View attendance
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm hover:text-white"
            >
              Back to dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['biometric-sync'] })
                syncQuery.refetch()
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" /> Refresh status
            </button>
          </div>
        </div>
      )}

      {!selectedDevice && step > 1 && step !== 1 && (
        <div>
          <button type="button" onClick={() => setStep(1)} className="text-emerald-400 hover:underline">
            Register a device first
          </button>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-light rounded-xl p-3">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  )
}
