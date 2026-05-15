import { api } from '@/lib/api'

export type DeviceVendor = 'essl' | 'generic'

export interface BiometricDevice {
  id: string
  name: string
  vendor: DeviceVendor
  external_device_id: string
  timezone: string
  location_label: string | null
  is_active: boolean
  last_seen_at: string | null
  has_ingest_token: boolean
}

export interface BiometricDeviceCreate {
  name: string
  vendor: DeviceVendor
  external_device_id: string
  timezone?: string
  location_label?: string
}

export interface DeviceUserMapping {
  id: string
  device_id: string
  member_id: string
  device_user_id: string
  member_name: string | null
  member_phone: string | null
}

export const biometricService = {
  async listDevices(): Promise<BiometricDevice[]> {
    const { data } = await api.get<BiometricDevice[]>('/biometric/devices')
    return data
  },

  async createDevice(payload: BiometricDeviceCreate): Promise<BiometricDevice> {
    const { data } = await api.post<BiometricDevice>('/biometric/devices', {
      timezone: 'Asia/Kolkata',
      ...payload,
    })
    return data
  },

  async rotateToken(deviceId: string): Promise<{ device_id: string; ingest_token: string }> {
    const { data } = await api.post<{ device_id: string; ingest_token: string }>(
      `/biometric/devices/${deviceId}/token`,
    )
    return data
  },

  async listMappings(deviceId: string): Promise<DeviceUserMapping[]> {
    const { data } = await api.get<DeviceUserMapping[]>('/biometric/mappings', {
      params: { device_id: deviceId },
    })
    return data
  },

  async upsertMapping(payload: {
    device_id: string
    member_id: string
    device_user_id: string
  }): Promise<DeviceUserMapping> {
    const { data } = await api.post<DeviceUserMapping>('/biometric/mappings', payload)
    return data
  },

  async deleteMapping(mappingId: string): Promise<void> {
    await api.delete(`/biometric/mappings/${mappingId}`)
  },
}

/** Resolve API base for agent env (no /api/v1 suffix). */
export function resolveApiBaseForAgent(): string {
  const env = import.meta.env.VITE_API_URL?.trim()
  if (env) return env.replace(/\/+$/, '')
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host.endsWith('.vercel.app') || host === 'activehq.fit' || host === 'www.activehq.fit') {
      return 'https://activehq-api.onrender.com'
    }
  }
  return typeof window !== 'undefined' ? window.location.origin : 'https://activehq-api.onrender.com'
}

export function buildAgentEnvBlock(opts: {
  deviceIp: string
  devicePort: string
  externalDeviceId: string
  ingestToken: string
}): string {
  const apiBase = resolveApiBaseForAgent()
  return `$env:DEVICE_IP="${opts.deviceIp}"
$env:DEVICE_PORT="${opts.devicePort}"
$env:DEVICE_TIMEZONE="Asia/Kolkata"
$env:EXTERNAL_DEVICE_ID="${opts.externalDeviceId}"
$env:ACTIVEHQ_API_BASE="${apiBase}"
$env:ACTIVEHQ_BIOMETRIC_TOKEN="${opts.ingestToken}"
$env:POLL_SECONDS="10"
python scripts/biometric_agent.py`
}
