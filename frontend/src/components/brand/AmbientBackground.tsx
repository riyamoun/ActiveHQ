import clsx from 'clsx'
import type { ReactNode } from 'react'

const GYM_PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=70',
    className: 'top-[-12%] left-[-8%] w-[55vw] max-w-xl aspect-[4/3]',
    delay: '0s',
  },
  {
    src: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=900&q=70',
    className: 'bottom-[-15%] right-[-10%] w-[50vw] max-w-lg aspect-square',
    delay: '6s',
  },
  {
    src: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=70',
    className: 'top-[35%] right-[5%] w-[40vw] max-w-md aspect-[3/4] hidden sm:block',
    delay: '12s',
  },
] as const

type AmbientVariant = 'public' | 'auth' | 'dashboard' | 'member'

const variantOverlay: Record<AmbientVariant, string> = {
  public: 'from-black via-black/92 to-black',
  auth: 'from-slate-950/95 via-slate-950/80 to-emerald-950/40',
  dashboard: 'from-slate-950 via-slate-950/97 to-slate-950',
  member: 'from-black via-black/94 to-black',
}

export interface AmbientBackgroundProps {
  variant?: AmbientVariant
  showLogoWatermark?: boolean
  className?: string
}

export function AmbientBackground({
  variant = 'public',
  showLogoWatermark = true,
  className,
}: AmbientBackgroundProps) {
  return (
    <div
      aria-hidden
      className={clsx('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {GYM_PHOTOS.map((photo) => (
        <div
          key={photo.src}
          className={clsx('absolute animate-ambient opacity-[0.14] sm:opacity-[0.11]', photo.className)}
          style={{ animationDelay: photo.delay }}
        >
          <div
            className="h-full w-full rounded-[40%] bg-cover bg-center blur-[72px] saturate-[0.85]"
            style={{ backgroundImage: `url('${photo.src}')` }}
          />
        </div>
      ))}

      <div
        className={clsx(
          'absolute inset-0 bg-gradient-to-br',
          variantOverlay[variant]
        )}
      />

      {showLogoWatermark && (
        <img
          src="/logo.jpg"
          alt=""
          className="absolute left-1/2 top-[18%] w-[min(420px,70vw)] -translate-x-1/2 opacity-[0.035] blur-[2px] select-none animate-logo-watermark"
        />
      )}

      <div className="absolute -top-1/3 left-1/2 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-lime-400/[0.06] blur-[120px] animate-ambient" />
      <div
        className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-emerald-600/[0.05] blur-[100px] animate-ambient"
        style={{ animationDelay: '8s' }}
      />
    </div>
  )
}

export function AmbientPage({
  variant = 'public',
  showLogoWatermark = true,
  className,
  children,
}: AmbientBackgroundProps & { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('relative isolate', className)}>
      <AmbientBackground variant={variant} showLogoWatermark={showLogoWatermark} />
      <div className="relative z-[1]">{children}</div>
    </div>
  )
}
