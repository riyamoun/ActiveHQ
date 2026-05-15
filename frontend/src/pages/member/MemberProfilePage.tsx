import { useMemberAuthStore } from '@/store/memberAuthStore'
import {
  Building2,
  Calendar,
  LogOut,
  Mail,
  MessageCircle,
  Phone,
  User as UserIcon,
} from 'lucide-react'

const WHATSAPP_LINK =
  'https://wa.me/919354349118?text=Hi%20ActiveHQ%2C%20I%20need%20to%20update%20my%20profile%20details.'

export function MemberProfilePage() {
  const member = useMemberAuthStore((s) => s.member)
  const logout = useMemberAuthStore((s) => s.logout)

  if (!member) return null

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-2xl font-bold">Your profile</h1>
        <p className="text-sm text-white/50 mt-1">
          Details we have on file. To update anything, message your gym.
        </p>
      </div>

      {/* Avatar block */}
      <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-lime-400/15 border border-lime-400/30 flex items-center justify-center overflow-hidden">
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <UserIcon className="w-7 h-7 text-lime-400" />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-xl font-bold truncate">{member.name}</div>
          <div className="flex items-center gap-1.5 text-xs text-white/50 mt-0.5 truncate">
            <Building2 className="w-3 h-3" />
            {member.gym_name}
          </div>
        </div>
      </div>

      {/* Detail list */}
      <ul className="space-y-2">
        <Row Icon={Phone} label="Phone" value={member.phone} />
        <Row Icon={Mail} label="Email" value={member.email || '— not on file'} muted={!member.email} />
        <Row
          Icon={Calendar}
          label="Member since"
          value={member.joined_date ? formatDate(member.joined_date) : '—'}
          muted={!member.joined_date}
        />
      </ul>

      {/* Edit hint */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 p-4 hover:bg-[#25D366]/15 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-white">Need to update something?</div>
            <div className="text-xs text-white/60">WhatsApp ActiveHQ — we'll fix it.</div>
          </div>
        </div>
      </a>

      <button
        type="button"
        onClick={logout}
        className="w-full mt-6 inline-flex items-center justify-center gap-2 py-3 rounded-full border border-white/15 text-white/70 hover:border-rose-500/40 hover:text-rose-300 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  )
}

function Row({
  Icon,
  label,
  value,
  muted = false,
}: {
  Icon: typeof Mail
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <li className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-white/70" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] tracking-[0.25em] uppercase text-white/40">{label}</div>
        <div className={`mt-0.5 truncate ${muted ? 'text-white/40 italic' : 'text-white'}`}>
          {value}
        </div>
      </div>
    </li>
  )
}

function formatDate(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}
