import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, User } from 'lucide-react';
import { useState, useEffect } from 'react';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/for-gym-owners', label: 'Features' },
  { to: '/gyms', label: 'Stories' },
  { to: '/contact', label: 'Contact' },
];

export function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerBg = isHome 
    ? scrolled ? 'bg-white/95 backdrop-blur-md border-b border-slate-100' : 'bg-transparent'
    : 'bg-white border-b border-slate-100';

  const textColor = isHome && !scrolled ? 'text-white' : 'text-slate-900';
  const textMuted = isHome && !scrolled ? 'text-white/70' : 'text-slate-600';

  return (
    <div className="min-h-screen">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER - Minimal, elegant
      ═══════════════════════════════════════════════════════════════════ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <span className={`text-xl tracking-tight ${textColor}`}>
                <span className="font-light">Active</span>
                <span className="font-semibold">HQ</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `text-sm tracking-wide transition-colors ${
                      isActive 
                        ? textColor
                        : `${textMuted} hover:${textColor}`
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Login Options */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/login"
                className={`flex items-center gap-2 px-4 py-2 text-sm tracking-wide transition-colors ${
                  isHome && !scrolled
                    ? 'text-white/80 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Owner Login
              </Link>
              <Link
                to="/login?demo=true"
                className={`flex items-center gap-2 px-5 py-2.5 text-sm tracking-wide rounded-full border transition-all ${
                  isHome && !scrolled
                    ? 'border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-white'
                    : 'border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                Try Demo
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 ${textColor}`}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100">
            <div className="px-8 py-6 space-y-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block py-2 text-lg ${
                      isActive ? 'text-slate-900' : 'text-slate-600'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="border-t border-slate-100 mt-4 pt-4 space-y-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-slate-600"
                >
                  <LogIn className="w-5 h-5" />
                  Owner Login
                </Link>
                <Link
                  to="/login?demo=true"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-3 bg-emerald-600 text-white text-center rounded-full"
                >
                  Try Demo
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Spacer for non-home pages */}
      {!isHome && <div className="h-20" />}

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════ */}
      <main>
        <Outlet />
      </main>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER - Elegant, minimal
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="grid md:grid-cols-5 gap-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="text-2xl mb-6">
                <span className="font-light">Active</span>
                <span className="font-semibold">HQ</span>
              </div>
              <p className="text-white/50 max-w-sm leading-relaxed">
                The modern gym management platform. 
                Simple, elegant, and built for growth.
              </p>
            </div>

            {/* Links */}
            <div>
              <div className="text-xs tracking-[0.2em] text-white/40 uppercase mb-6">Navigation</div>
              <div className="space-y-4">
                {navLinks.map((link) => (
                  <Link 
                    key={link.to}
                    to={link.to} 
                    className="block text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <div className="text-xs tracking-[0.2em] text-white/40 uppercase mb-6">Contact</div>
              <div className="space-y-4 text-white/60">
                <a href="mailto:hello@activehq.in" className="block hover:text-white transition-colors">
                  hello@activehq.in
                </a>
                <a href="tel:+919876543210" className="block hover:text-white transition-colors">
                  +91 98765 43210
                </a>
                <div>Gurgaon, India</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-white/40">
            <div>© 2026 ActiveHQ. All rights reserved.</div>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
