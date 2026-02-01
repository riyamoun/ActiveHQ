import { Mail, Phone, MapPin, Dumbbell } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ActiveHQ</span>
            </div>
            <p className="text-slate-400 max-w-sm mb-6">
              Modern gym management for Indian fitness businesses. Simple. Powerful. Affordable.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-slate-400">
                <MapPin className="h-4 w-4 text-emerald-500" />
                <span>Bangalore, Karnataka</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <Mail className="h-4 w-4 text-emerald-500" />
                <span>hello@activehq.in</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <Phone className="h-4 w-4 text-emerald-500" />
                <span>+91 98765 43210</span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-3">
              {['Features', 'Pricing', 'Demo', 'Updates'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-3">
              {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} ActiveHQ. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            Made with <span className="text-red-500">❤</span> in India <span>🇮🇳</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
