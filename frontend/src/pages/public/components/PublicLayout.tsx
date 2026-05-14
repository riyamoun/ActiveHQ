import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/coach', label: 'AI Coach', highlight: true },
  { to: '/for-gym-owners', label: 'Why ActiveHQ' },
  { to: '/gyms', label: 'For Gyms' },
  { to: '/contact', label: 'Contact' },
];

const WHATSAPP_LINK = 'https://wa.me/919354349118?text=Hi%20ActiveHQ%2C%20I%20run%20a%20gym%20and%20want%20to%20book%20a%20demo.';

export function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-black text-white antialiased selection:bg-lime-400/30 selection:text-white">
      {/* ════════════════════════════════════════════════════════════════
          HEADER — black, minimal, neon-green CTA
      ════════════════════════════════════════════════════════════════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-black/90 backdrop-blur-xl border-b border-white/10'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-lime-400 group-hover:shadow-[0_0_20px_rgba(163,230,53,0.8)] transition-shadow" />
              <span className="text-lg sm:text-xl tracking-tight text-white">
                <span className="font-light">Active</span>
                <span className="font-bold">HQ</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-7 lg:gap-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `relative text-sm font-medium tracking-wide transition-colors ${
                      isActive
                        ? 'text-white'
                        : link.highlight
                          ? 'text-lime-400 hover:text-lime-300'
                          : 'text-white/60 hover:text-white'
                    }`
                  }
                >
                  <span className="inline-flex items-center gap-1.5">
                    {link.label}
                    {link.highlight && (
                      <span className="text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-400">
                        new
                      </span>
                    )}
                  </span>
                </NavLink>
              ))}
            </nav>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm text-white/70 hover:text-white transition-colors px-3 py-2"
              >
                Login
              </Link>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('cta_click', { location: 'header', cta: 'whatsapp' })}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-lime-400 text-black text-sm font-bold rounded-full hover:bg-lime-300 hover:shadow-[0_0_28px_rgba(163,230,53,0.4)] transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                Talk on WhatsApp
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black border-t border-white/10">
            <div className="px-5 py-6 space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between py-3 text-base ${
                      isActive
                        ? 'text-white font-semibold'
                        : link.highlight
                          ? 'text-lime-400'
                          : 'text-white/70'
                    }`
                  }
                >
                  <span>{link.label}</span>
                  {link.highlight && (
                    <span className="text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-400">
                      new
                    </span>
                  )}
                </NavLink>
              ))}
              <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
                <Link
                  to="/login"
                  className="block py-2 text-white/70"
                >
                  Login
                </Link>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('cta_click', { location: 'mobile_menu', cta: 'whatsapp' })}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-lime-400 text-black font-bold rounded-full"
                >
                  <MessageCircle className="w-5 h-5" />
                  Talk on WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Spacer for non-hero pages */}
      {location.pathname !== '/' && <div className="h-16 sm:h-18" />}

      {/* ════════════════════════════════════════════════════════════════
          MAIN
      ════════════════════════════════════════════════════════════════ */}
      <main>
        <Outlet />
      </main>

      {/* ════════════════════════════════════════════════════════════════
          FLOATING WHATSAPP — sticky bottom-right on every public page
      ════════════════════════════════════════════════════════════════ */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent('cta_click', { location: 'floating', cta: 'whatsapp' })}
        aria-label="Talk on WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-[#25D366] text-white shadow-2xl shadow-[#25D366]/40 hover:scale-105 transition-transform"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-semibold">WhatsApp</span>
      </a>

      {/* ════════════════════════════════════════════════════════════════
          FOOTER — black, structured
      ════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
          <div className="grid md:grid-cols-5 gap-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-lime-400" />
                <span className="text-2xl text-white">
                  <span className="font-light">Active</span>
                  <span className="font-bold">HQ</span>
                </span>
              </div>
              <p className="text-white/50 max-w-sm leading-relaxed">
                Run your gym in 10 minutes a day. Built in India, for Indian gyms.
                Cash, UPI, biometric and WhatsApp — all in one place.
              </p>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-full bg-lime-400 text-black text-sm font-bold hover:bg-lime-300 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Talk on WhatsApp
              </a>
            </div>

            {/* Nav */}
            <div>
              <div className="text-[11px] tracking-[0.25em] text-white/40 uppercase mb-5">Pages</div>
              <div className="space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block text-white/60 hover:text-lime-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <div className="text-[11px] tracking-[0.25em] text-white/40 uppercase mb-5">Contact</div>
              <div className="space-y-3 text-white/60">
                <a
                  href="mailto:info@activehq.fit"
                  className="block hover:text-lime-400 transition-colors"
                >
                  info@activehq.fit
                </a>
                <a
                  href="tel:+919354349118"
                  className="block hover:text-lime-400 transition-colors"
                >
                  +91 93543 49118
                </a>
                <div>Gurgaon, India</div>
              </div>
            </div>

            {/* Trust */}
            <div>
              <div className="text-[11px] tracking-[0.25em] text-white/40 uppercase mb-5">Built for</div>
              <div className="space-y-3 text-white/60 text-sm">
                <div>Cash + UPI gyms</div>
                <div>WhatsApp-first owners</div>
                <div>10–5,000 member gyms</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-white/40">
            <div>© 2026 ActiveHQ · Made in India</div>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
