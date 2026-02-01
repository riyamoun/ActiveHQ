import { Phone, MessageCircle } from 'lucide-react';

export function LocalPricing() {
  return (
    <section className="bg-slate-950 py-16 border-t border-slate-800">
      <div className="max-w-xl mx-auto px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-white text-xl font-medium mb-2">Software Charges</h2>
            <p className="text-slate-500 text-sm">Simple, transparent pricing</p>
          </div>

          {/* Pricing items */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between py-4 border-b border-slate-800">
              <div>
                <p className="text-white font-medium">One-time setup fee</p>
                <p className="text-slate-500 text-sm">Includes onboarding & training</p>
              </div>
              <p className="text-white text-lg font-medium">₹2,500</p>
            </div>
            <div className="flex items-center justify-between py-4 border-b border-slate-800">
              <div>
                <p className="text-white font-medium">Yearly renewal</p>
                <p className="text-slate-500 text-sm">Full access, all features</p>
              </div>
              <p className="text-white text-lg font-medium">₹3,000/year</p>
            </div>
          </div>

          {/* Founding offer */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
            <p className="text-amber-400 text-sm font-medium text-center">
              🎁 Founding gym discounts available — limited spots
            </p>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <a
              href="tel:+919876543210"
              className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors"
            >
              <Phone className="h-5 w-5" />
              Talk to Us
            </a>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 transition-colors"
            >
              <MessageCircle className="h-5 w-5 text-green-500" />
              WhatsApp
            </a>
          </div>

          {/* Trust line */}
          <p className="text-center text-slate-600 text-xs mt-6">
            No hidden charges • GST extra if applicable
          </p>
        </div>
      </div>
    </section>
  );
}
