import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
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

            {/* CTA */}
            <div className="hidden md:block">
              <Link
                to="/contact"
                className={`px-6 py-2.5 text-sm tracking-wide rounded-full border transition-all ${
                  isHome && !scrolled
                    ? 'border-white/30 text-white hover:bg-white hover:text-slate-900'
                    : 'border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white'
                }`}
              >
                Get Started
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
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-3 bg-slate-900 text-white text-center rounded-full mt-6"
              >
                Get Started
              </Link>
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
          <div className="grid md:grid-cols-4 gap-12">
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
