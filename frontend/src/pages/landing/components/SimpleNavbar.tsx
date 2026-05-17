import { Phone } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

export function SimpleNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          <Logo size="sm" href="/" />

          {/* Right side */}
          <div className="flex items-center gap-4">
            <a
              href="tel:+919354349118"
              className="hidden sm:flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span>+91 93543 49118</span>
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
