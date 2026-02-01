import { Dumbbell, Mail, Phone, MapPin } from 'lucide-react';

export function SimpleFooter() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-semibold">ActiveHQ</span>
            </div>
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
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="h-4 w-4" />
                <span>hello@activehq.in</span>
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
              <a href="#" className="block text-slate-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="block text-slate-400 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="block text-slate-400 hover:text-white transition-colors">Refund Policy</a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-sm">© 2026 ActiveHQ. All rights reserved.</p>
          <p className="text-slate-600 text-sm">Made in India 🇮🇳</p>
        </div>
      </div>
    </footer>
  );
}
