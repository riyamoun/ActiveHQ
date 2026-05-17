import { Outlet } from 'react-router-dom'
import { AmbientBackground } from '@/components/brand/AmbientBackground'
import { Logo } from '@/components/brand/Logo'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-950 flex relative">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <AmbientBackground variant="auth" showLogoWatermark />
        <div className="absolute inset-0 flex flex-col justify-between p-12 z-10">
          <Logo size="lg" to="/" />

          <div>
            <blockquote className="text-2xl font-light text-white/90 leading-relaxed mb-4">
              "The platform that transformed how we manage our gym.
              Simple, elegant, and powerful."
            </blockquote>
            <div className="text-white/40 text-sm">
              — Pilot gym owner, Gurgaon
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <AmbientBackground
          variant="auth"
          showLogoWatermark={false}
          className="lg:hidden opacity-60"
        />
        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden text-center mb-12">
            <Logo size="md" to="/" className="justify-center w-full [&_img]:mx-auto" />
            <p className="text-slate-500 mt-3 text-sm">Gym Management Platform</p>
          </div>

          <Outlet />

          <p className="text-center text-slate-600 text-sm mt-12">
            &copy; {new Date().getFullYear()} ActiveHQ. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
