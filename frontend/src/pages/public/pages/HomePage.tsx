import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Play, 
  Smartphone, 
  QrCode, 
  Bell, 
  TrendingUp,
  Calendar,
  Trophy,
  Zap,
  Shield
} from 'lucide-react';

export function HomePage() {
  return (
    <div className="bg-white text-slate-900">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80"
            alt="Gym"
            className="w-full h-full object-cover"
            loading="eager"
          />
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
                className="px-8 py-4 bg-white text-slate-900 font-medium rounded-full hover:bg-emerald-400 hover:text-white transition-colors duration-200"
              >
                Get Started
              </Link>
              <button className="flex items-center gap-3 text-white/80 hover:text-white transition-colors duration-200">
                <span className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center">
                  <Play className="w-4 h-4 ml-0.5" />
                </span>
                <span className="text-sm">Watch video</span>
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* STATS BAR */}
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
          FOR MEMBERS - Technical & Attractive Section
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-emerald-600 text-sm tracking-[0.2em] uppercase mb-4">
              For Members
            </p>
            <h2 className="text-3xl md:text-5xl font-light text-slate-900 mb-4">
              Your fitness journey, <span className="font-medium">digitized</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Experience gym like never before. Everything you need, right in your pocket.
            </p>
          </div>

          {/* Phone Mockup with Features */}
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            {/* Left Features */}
            <div className="space-y-8">
              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500 transition-colors duration-200">
                    <QrCode className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors duration-200" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 mb-1">Instant Check-in</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Scan QR code at entry. No waiting, no hassle. Your attendance logged automatically.
                    </p>
                  </div>
                </div>
              </div>

              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 transition-colors duration-200">
                    <Calendar className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-200" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 mb-1">Membership Tracker</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Always know your plan status, renewal dates, and payment history at a glance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500 transition-colors duration-200">
                    <Bell className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors duration-200" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 mb-1">Smart Reminders</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Get WhatsApp notifications for renewals, offers, and gym updates.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Center - App Preview */}
            <div className="relative flex justify-center">
              <div className="relative">
                {/* Phone Frame */}
                <div className="w-64 h-[520px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-[2.5rem] overflow-hidden relative">
                    {/* Status Bar */}
                    <div className="px-6 pt-4 flex justify-between items-center text-white/80 text-xs">
                      <span>9:41</span>
                      <div className="w-20 h-6 bg-black rounded-full" />
                      <span>100%</span>
                    </div>
                    
                    {/* App Content */}
                    <div className="px-6 pt-8 text-white">
                      <p className="text-white/70 text-sm">Good morning,</p>
                      <h3 className="text-2xl font-semibold mb-6">Rahul 👋</h3>
                      
                      {/* Stats Cards */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                          <div className="text-2xl font-bold">18</div>
                          <div className="text-xs text-white/70">Days Left</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                          <div className="text-2xl font-bold">24</div>
                          <div className="text-xs text-white/70">This Month</div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium">Quick Check-in</span>
                          <Zap className="w-4 h-4" />
                        </div>
                        <div className="w-full h-10 bg-white rounded-lg flex items-center justify-center">
                          <span className="text-emerald-600 font-semibold text-sm">Tap to Check In</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Nav */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur px-8 py-4">
                      <div className="flex justify-between">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-white/60" />
                        </div>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-white/60" />
                        </div>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-white/60" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Badges */}
                <div className="absolute -left-8 top-20 bg-white rounded-xl shadow-lg p-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Secure</span>
                </div>

                <div className="absolute -right-8 bottom-32 bg-white rounded-xl shadow-lg p-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Instant</span>
                </div>
              </div>
            </div>

            {/* Right Features */}
            <div className="space-y-8">
              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500 transition-colors duration-200">
                    <TrendingUp className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors duration-200" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 mb-1">Progress Analytics</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Track your attendance patterns. See your consistency. Stay motivated.
                    </p>
                  </div>
                </div>
              </div>

              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0 group-hover:bg-pink-500 transition-colors duration-200">
                    <Trophy className="w-6 h-6 text-pink-600 group-hover:text-white transition-colors duration-200" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 mb-1">Rewards & Offers</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Get exclusive discounts on renewals. Early bird offers delivered to you first.
                    </p>
                  </div>
                </div>
              </div>

              <div className="group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500 transition-colors duration-200">
                    <Smartphone className="w-6 h-6 text-cyan-600 group-hover:text-white transition-colors duration-200" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 mb-1">Digital Membership</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      No plastic cards needed. Your phone is your membership. Always accessible.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOR GYM OWNERS - Feature Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80"
                alt="Gym member"
                className="w-full aspect-[4/5] object-cover rounded-2xl"
                loading="lazy"
              />
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-500 rounded-2xl -z-10" />
            </div>

            <div className="lg:pl-8">
              <p className="text-emerald-600 text-sm tracking-[0.2em] uppercase mb-4">
                For Gym Owners
              </p>
              <h2 className="text-3xl md:text-4xl font-light text-slate-900 leading-tight mb-6">
                Run your gym
                <br />
                <span className="font-medium">effortlessly</span>
              </h2>
              <p className="text-lg text-slate-600 font-light leading-relaxed mb-8">
                From member onboarding to revenue tracking, everything in one dashboard. 
                Spend less time on admin, more time growing your business.
              </p>
              <ul className="space-y-4 text-slate-600 mb-8">
                {[
                  'Complete member management',
                  'Automated payment tracking',
                  'WhatsApp notifications',
                  'Real-time analytics & reports',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/for-gym-owners"
                className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200"
              >
                Learn more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FULL WIDTH PARALLAX */}
      <section className="relative py-32">
        <img 
          src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1920&q=80"
          alt="Gym interior"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
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

      {/* GALLERY */}
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
              <div key={i} className="aspect-square rounded-xl overflow-hidden">
                <img 
                  src={img}
                  alt={`Gym ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
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

      {/* PRICING */}
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
              className="block w-full py-4 bg-white text-slate-900 font-medium rounded-full hover:bg-emerald-400 hover:text-white transition-colors duration-200"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-32">
        <img 
          src="https://images.unsplash.com/photo-1576678927484-cc907957088c?w=1920&q=80"
          alt="Gym workout"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
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
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-medium rounded-full hover:bg-emerald-400 hover:text-white transition-colors duration-200"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
