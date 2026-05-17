import { Phone, MessageCircle } from 'lucide-react';
import { formatInr, PRICING } from '@/constants/pricing';

export function LocalPricing() {
  const { normal, founding } = PRICING;

  return (
    <section className="bg-slate-950 py-16 border-t border-slate-800">
      <div className="max-w-xl mx-auto px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-white text-xl font-medium mb-2">Software Charges</h2>
            <p className="text-slate-500 text-sm">Simple, transparent pricing</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between py-4 border-b border-slate-800">
              <div>
                <p className="text-white font-medium">Standard — one-time setup</p>
                <p className="text-slate-500 text-sm">Onboarding & training</p>
              </div>
              <p className="text-white text-lg font-medium">₹{formatInr(normal.setupInr)}</p>
            </div>
            <div className="flex items-center justify-between py-4 border-b border-slate-800">
              <div>
                <p className="text-white font-medium">Standard — yearly</p>
                <p className="text-slate-500 text-sm">Full access, all features</p>
              </div>
              <p className="text-white text-lg font-medium">₹{formatInr(normal.yearlyInr)}/year</p>
            </div>
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-amber-400 font-medium">Founding gym — first year</p>
                <p className="text-slate-500 text-sm">+ ₹{formatInr(founding.setupInr)} setup</p>
              </div>
              <p className="text-amber-400 text-lg font-medium">₹{formatInr(founding.yearlyInr)}</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
            <p className="text-amber-400 text-sm font-medium text-center">
              Founding gym: ₹{formatInr(founding.yearlyInr)} first year + ₹
              {formatInr(founding.setupInr)} setup — limited spots
            </p>
          </div>

          <div className="space-y-3">
            <a
              href="tel:+919354349118"
              className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors"
            >
              <Phone className="h-5 w-5" />
              Talk to Us
            </a>
            <a
              href="https://wa.me/919354349118"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 transition-colors"
            >
              <MessageCircle className="h-5 w-5 text-green-500" />
              WhatsApp
            </a>
          </div>

          <p className="text-center text-slate-600 text-xs mt-6">
            No hidden charges · GST extra if applicable
          </p>
        </div>
      </div>
    </section>
  );
}
