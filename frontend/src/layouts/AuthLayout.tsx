import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side - Image */}
      <div 
        className="hidden lg:block lg:w-1/2 bg-cover bg-center relative"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-slate-900/60" />
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          {/* Logo */}
          <div className="text-2xl text-white">
            <span className="font-light">Active</span>
            <span className="font-semibold">HQ</span>
          </div>
          
          {/* Quote */}
          <div>
            <blockquote className="text-2xl font-light text-white leading-relaxed mb-4">
              "The platform that transformed how we manage our gym. 
              Simple, elegant, and powerful."
            </blockquote>
            <div className="text-white/60">
              — Rajesh Verma, FitFirst Gym
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-12">
            <div className="text-3xl">
              <span className="font-light">Active</span>
              <span className="font-semibold">HQ</span>
            </div>
            <p className="text-slate-500 mt-2">Gym Management Platform</p>
          </div>

          {/* Auth Form */}
          <Outlet />

          {/* Footer */}
          <p className="text-center text-slate-400 text-sm mt-12">
            © {new Date().getFullYear()} ActiveHQ. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
