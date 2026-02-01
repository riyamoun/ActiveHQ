import { Dumbbell, Phone } from 'lucide-react';

export function SimpleNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-semibold text-lg">ActiveHQ</span>
          </a>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <a
              href="tel:+919876543210"
              className="hidden sm:flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span>+91 98765 43210</span>
            </a>
            <a
              href="/login"
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              Login
            </a>
            <a
              href="#demo"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Get Demo
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
