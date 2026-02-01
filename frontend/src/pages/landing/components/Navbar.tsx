import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Dumbbell } from 'lucide-react';

const navLinks = [
  { name: 'Features', href: '#features' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Contact', href: '#demo' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className={`transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <nav className={`flex items-center justify-between rounded-2xl transition-all duration-300 ${
            scrolled ? 'bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 px-6 py-3 shadow-xl' : ''
          }`}>
            {/* Logo */}
            <a href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ActiveHQ</span>
            </a>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-4">
              <a
                href="/login"
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Login
              </a>
              <a
                href="#demo"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/40"
              >
                Start Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 p-4">
          <div className="rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 overflow-hidden shadow-xl">
            <div className="p-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block py-3 px-4 rounded-xl text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 mt-4 border-t border-slate-700/50 space-y-3">
                <a
                  href="/login"
                  className="block py-3 px-4 text-base font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Login
                </a>
                <a
                  href="#demo"
                  className="block w-full text-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3.5 text-base font-semibold text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Start Free
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
