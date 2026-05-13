import { Outlet } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left side - Visual */}
      <div
        className="hidden lg:block lg:w-1/2 bg-cover bg-center relative overflow-hidden"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-emerald-900/50" />
        <div className="absolute inset-0 mesh-gradient opacity-50" />
        <div className="absolute inset-0 flex flex-col justify-between p-12 relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl text-white">
              <span className="font-light tracking-wide">Active</span>
              <span className="font-bold">HQ</span>
            </div>
          </div>

          {/* Quote */}
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

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-12">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl text-white">
                <span className="font-light">Active</span>
                <span className="font-bold">HQ</span>
              </div>
            </div>
            <p className="text-slate-500 mt-3 text-sm">Gym Management Platform</p>
          </div>

          {/* Auth Form */}
          <Outlet />

          {/* Footer */}
          <p className="text-center text-slate-600 text-sm mt-12">
            &copy; {new Date().getFullYear()} ActiveHQ. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
