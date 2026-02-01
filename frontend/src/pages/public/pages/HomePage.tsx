import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';

export function HomePage() {
  return (
    <div className="bg-white text-slate-900">
      {/* ═══════════════════════════════════════════════════════════════════
          HERO - Full screen with fitness imagery
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center">
        {/* Background Image - Fitness gym atmosphere */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80')`,
            }}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-8 py-32">
          <div className="max-w-2xl">
            <p className="text-emerald-400 text-sm tracking-[0.3em] uppercase mb-6">
              Gym Management System
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-white leading-[1.1] mb-8">
              Elevate your
              <br />
              <span className="font-medium">fitness business</span>
            </h1>
            <p className="text-xl text-white/70 font-light leading-relaxed mb-10 max-w-lg">
              The complete platform for modern gyms. 
              Membership, payments, and growth — simplified.
            </p>
            <div className="flex items-center gap-6">
              <Link
                to="/contact"
                className="px-8 py-4 bg-white text-slate-900 font-medium rounded-full hover:bg-emerald-400 hover:text-white transition-all"
              >
                Get Started
              </Link>
              <button className="flex items-center gap-3 text-white/80 hover:text-white transition-colors">
                <span className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center">
                  <Play className="w-4 h-4 ml-0.5" />
                </span>
                <span className="text-sm">Watch video</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS BAR - Minimal, elegant
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '500+', label: 'Active Gyms' },
              { value: '50K+', label: 'Members Managed' },
              { value: '98%', label: 'Retention Rate' },
              { value: '24/7', label: 'Support' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-light text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500 tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURE 1 - Image left, text right
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <div className="relative">
              <div 
                className="aspect-[4/5] rounded-2xl bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80')`,
                }}
              />
              {/* Floating accent */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-500 rounded-2xl -z-10" />
            </div>

            {/* Content */}
            <div className="lg:pl-8">
              <p className="text-emerald-600 text-sm tracking-[0.2em] uppercase mb-4">
                Member Experience
              </p>
              <h2 className="text-3xl md:text-4xl font-light text-slate-900 leading-tight mb-6">
                Seamless member
                <br />
                <span className="font-medium">management</span>
              </h2>
              <p className="text-lg text-slate-600 font-light leading-relaxed mb-8">
                From onboarding to renewal, every touchpoint is designed 
                for simplicity. Your members feel the difference.
              </p>
              <ul className="space-y-4 text-slate-600">
                {[
                  'One-tap check-in system',
                  'Automated renewal reminders',
                  'Personal progress tracking',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURE 2 - Full width image with overlay text
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-32">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-slate-900/80" />
        
        <div className="relative max-w-7xl mx-auto px-8 text-center">
          <p className="text-emerald-400 text-sm tracking-[0.2em] uppercase mb-4">
            Financial Clarity
          </p>
          <h2 className="text-3xl md:text-5xl font-light text-white leading-tight mb-6 max-w-3xl mx-auto">
            Every payment tracked.
            <br />
            <span className="font-medium">Every rupee accounted.</span>
          </h2>
          <p className="text-lg text-white/60 font-light max-w-xl mx-auto">
            Cash, UPI, cards — all in one dashboard. 
            Daily reconciliation in minutes, not hours.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURE 3 - Text left, image right
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <div className="lg:pr-8 order-2 lg:order-1">
              <p className="text-emerald-600 text-sm tracking-[0.2em] uppercase mb-4">
                Intelligence
              </p>
              <h2 className="text-3xl md:text-4xl font-light text-slate-900 leading-tight mb-6">
                Data-driven
                <br />
                <span className="font-medium">decisions</span>
              </h2>
              <p className="text-lg text-slate-600 font-light leading-relaxed mb-8">
                Understand your gym like never before. Real-time analytics 
                that reveal patterns and predict opportunities.
              </p>
              <Link
                to="/for-gym-owners"
                className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Learn more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Image */}
            <div className="relative order-1 lg:order-2">
              <div 
                className="aspect-[4/5] rounded-2xl bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&q=80')`,
                }}
              />
              {/* Floating accent */}
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-slate-900 rounded-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          IMAGE GALLERY - 3 columns
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <p className="text-emerald-600 text-sm tracking-[0.2em] uppercase mb-4">
              Our Community
            </p>
            <h2 className="text-3xl md:text-4xl font-light text-slate-900">
              Trusted by <span className="font-medium">leading gyms</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80',
              'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=600&q=80',
              'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80',
            ].map((img, i) => (
              <div 
                key={i}
                className="aspect-square rounded-xl bg-cover bg-center hover:scale-[1.02] transition-transform duration-500"
                style={{ backgroundImage: `url('${img}')` }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TESTIMONIAL - Clean, minimal
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-32">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto mb-8 flex items-center justify-center text-2xl">
            "
          </div>
          <blockquote className="text-2xl md:text-3xl font-light text-slate-700 leading-relaxed mb-8">
            ActiveHQ transformed how we operate. What used to take hours now takes minutes. 
            Our team can finally focus on what matters — our members.
          </blockquote>
          <div>
            <div className="font-medium text-slate-900">Rajesh Verma</div>
            <div className="text-slate-500 text-sm">FitFirst Gym, Gurgaon</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PRICING - Elegant, simple
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <p className="text-emerald-400 text-sm tracking-[0.2em] uppercase mb-4">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-light mb-4">
            Simple, transparent <span className="font-medium">pricing</span>
          </h2>
          <p className="text-white/60 mb-12">
            Everything you need. One price. No surprises.
          </p>

          <div className="bg-white/5 backdrop-blur rounded-2xl p-8 md:p-12 border border-white/10 max-w-lg mx-auto">
            <div className="text-5xl md:text-6xl font-light mb-2">
              ₹15,000
              <span className="text-xl text-white/50">/year</span>
            </div>
            <div className="text-white/50 mb-8">+ ₹5,000 one-time setup</div>
            
            <div className="space-y-3 text-left text-white/80 mb-8">
              {[
                'Unlimited members',
                'All features included',
                'WhatsApp automation',
                'Priority support',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  {feature}
                </div>
              ))}
            </div>

            <Link
              to="/contact"
              className="block w-full py-4 bg-white text-slate-900 font-medium rounded-full hover:bg-emerald-400 hover:text-white transition-all"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FINAL CTA - Full width image
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-32">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1576678927484-cc907957088c?w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        
        <div className="relative max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-light text-white leading-tight mb-8">
            Ready to elevate
            <br />
            <span className="font-medium">your gym?</span>
          </h2>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-medium rounded-full hover:bg-emerald-400 hover:text-white transition-all"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
