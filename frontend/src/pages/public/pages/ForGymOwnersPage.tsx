import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function ForGymOwnersPage() {
  return (
    <div className="bg-white text-slate-900">
      {/* ═══════════════════════════════════════════════════════════════════
          HERO - Full width image
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
        
        <div className="relative max-w-7xl mx-auto px-8">
          <p className="text-emerald-400 text-sm tracking-[0.3em] uppercase mb-6">
            For Gym Owners
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-[1.1] max-w-2xl">
            Built for those who
            <br />
            <span className="font-medium">build bodies</span>
          </h1>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          INTRO TEXT
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <p className="text-xl md:text-2xl font-light text-slate-600 leading-relaxed">
            We understand gym operations. The early mornings, the cash handling, 
            the member follow-ups, the renewal chasing. ActiveHQ handles the 
            operational burden so you can focus on your members.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURES - Alternating layout
      ═══════════════════════════════════════════════════════════════════ */}
      
      {/* Feature 1 */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div 
              className="aspect-[4/3] rounded-xl bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=800&q=80')`,
              }}
            />
            <div>
              <span className="text-emerald-600 text-sm tracking-[0.2em] uppercase">01</span>
              <h2 className="text-3xl font-light text-slate-900 mt-4 mb-6">
                Member <span className="font-medium">lifecycle</span>
              </h2>
              <p className="text-lg text-slate-600 font-light leading-relaxed mb-6">
                From first inquiry to loyal member. Track every step of the journey. 
                Know who's slipping before they ghost.
              </p>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  One-tap check-in
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Inactivity alerts
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Automated follow-ups
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2 */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <span className="text-emerald-600 text-sm tracking-[0.2em] uppercase">02</span>
              <h2 className="text-3xl font-light text-slate-900 mt-4 mb-6">
                Payment <span className="font-medium">clarity</span>
              </h2>
              <p className="text-lg text-slate-600 font-light leading-relaxed mb-6">
                Cash and UPI in one dashboard. Daily reconciliation that actually 
                matches. No more end-of-day guessing games.
              </p>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Cash + UPI tracking
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Daily closing reports
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Payment history
                </li>
              </ul>
            </div>
            <div 
              className="aspect-[4/3] rounded-xl bg-cover bg-center order-1 lg:order-2"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&q=80')`,
              }}
            />
          </div>
        </div>
      </section>

      {/* Feature 3 */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div 
              className="aspect-[4/3] rounded-xl bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1581009137042-c552e485697a?w=800&q=80')`,
              }}
            />
            <div>
              <span className="text-emerald-600 text-sm tracking-[0.2em] uppercase">03</span>
              <h2 className="text-3xl font-light text-slate-900 mt-4 mb-6">
                Renewal <span className="font-medium">automation</span>
              </h2>
              <p className="text-lg text-slate-600 font-light leading-relaxed mb-6">
                WhatsApp reminders that go out automatically. 7 days, 3 days, 1 day 
                before expiry. No more chasing.
              </p>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Automatic reminders
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Expiry dashboard
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  40% more renewals
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FULL WIDTH QUOTE
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-32 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <p className="text-2xl md:text-3xl font-light leading-relaxed text-white/80">
            "What used to take 2 hours now takes 10 minutes. 
            We finally have time to actually train our members."
          </p>
          <div className="mt-8 text-white/50">
            — Priya Sharma, FlexZone Gym
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PRICING
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-8">
          <div className="text-center mb-16">
            <p className="text-emerald-600 text-sm tracking-[0.2em] uppercase mb-4">
              Investment
            </p>
            <h2 className="text-3xl md:text-4xl font-light text-slate-900">
              Transparent <span className="font-medium">pricing</span>
            </h2>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8 md:p-12 text-center">
            <div className="text-5xl font-light text-slate-900 mb-2">
              ₹15,000<span className="text-xl text-slate-500">/year</span>
            </div>
            <div className="text-slate-500 mb-8">+ ₹5,000 one-time setup</div>
            
            <div className="grid md:grid-cols-2 gap-4 text-left max-w-md mx-auto mb-10">
              {[
                'Unlimited members',
                'All features',
                'WhatsApp automation',
                'Staff training',
                'Data migration',
                'Priority support',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-600">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  {feature}
                </div>
              ))}
            </div>

            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-full hover:bg-emerald-600 transition-all"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-32">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="relative max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-light text-white leading-tight mb-8">
            Ready to simplify
            <br />
            <span className="font-medium">your operations?</span>
          </h2>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-full hover:bg-emerald-400 hover:text-white transition-all"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
