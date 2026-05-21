import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import StoreBadges from '@/components/mobile/StoreBadges';

export function SimpleFooter() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Logo size="sm" to="/" className="mb-4" />
            <p className="text-slate-500 text-sm">
              Gym management software built for Indian fitness businesses.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-sm font-medium mb-4">Contact</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Phone className="h-4 w-4" />
                <span>+91 93543 49118</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="h-4 w-4" />
                <span>info@activehq.fit</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="h-4 w-4" />
                <span>Bangalore, India</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white text-sm font-medium mb-4">Quick Links</h4>
            <div className="space-y-2 text-sm">
              <Link to="/privacy" className="block text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="block text-slate-400 hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/account/delete" className="block text-slate-400 hover:text-white transition-colors">Delete Account</Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-slate-800 space-y-4">
          <StoreBadges />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-sm">© 2026 ActiveHQ. All rights reserved.</p>
          <p className="text-slate-600 text-sm">Made in India 🇮🇳</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
