import { useState } from 'react';
import { Phone, Mail, MapPin, Check, MessageCircle, ArrowRight } from 'lucide-react';
import { publicApi, getErrorMessage } from '@/lib/api';
import { SeoMeta } from '@/components/seo/SeoMeta';
import { buildLeadSource, trackEvent } from '@/lib/analytics';

const WHATSAPP_LINK =
  'https://wa.me/919354349118?text=Hi%20ActiveHQ%2C%20I%20run%20a%20gym%20and%20want%20to%20book%20a%20demo.';

export function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    gym_name: '',
    phone: '',
    city: 'Gurgaon',
    locality: '',
    email: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    trackEvent('demo_request_submit_attempt', { city: form.city });

    try {
      await publicApi.post('/public/demo-request', {
        ...form,
        source: buildLeadSource('public_site'),
      });
      setStatus('success');
      trackEvent('demo_request_submit_success', { city: form.city });
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        `${getErrorMessage(err)} You can also message info@activehq.fit or WhatsApp us.`
      );
      trackEvent('demo_request_submit_failed', { city: form.city });
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-5 sm:px-8 bg-black text-white">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-lime-400 mx-auto mb-6 flex items-center justify-center shadow-[0_0_40px_rgba(163,230,53,0.4)]">
            <Check className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Request <span className="text-lime-400">received.</span>
          </h1>
          <p className="text-lg text-white/60 mb-8">
            We'll WhatsApp you within 24 hours to schedule your 15-min demo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/20 text-white rounded-full hover:border-lime-400/60 hover:text-lime-400 transition-colors"
            >
              Back to home
            </a>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-lime-400 text-black font-bold rounded-full hover:bg-lime-300 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Message us now
            </a>
          </div>
        </div>
      </div>
    );
  }

  const inputCls =
    'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 transition';

  return (
    <div className="bg-black text-white">
      <SeoMeta
        title="Request a Demo | ActiveHQ"
        description="Book a personalized ActiveHQ demo for your gym. Get setup, pricing, and growth automation walkthrough."
        path="/contact"
      />

      {/* HERO */}
      <section className="relative pt-20 pb-12 sm:pb-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-lime-400/10 blur-[180px] rounded-full" />
        </div>
        <div className="relative max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-lime-400/30 bg-lime-400/5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-xs tracking-[0.2em] uppercase text-lime-400 font-medium">
              Book a demo
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold leading-[0.95] tracking-tight">
            See ActiveHQ on
            <br />
            <span className="text-lime-400">your gym's data.</span>
          </h1>
          <p className="mt-6 text-lg text-white/60 max-w-xl mx-auto">
            15-minute call. We migrate your old data live on the call itself.
            You only commit once you've seen it working.
          </p>
        </div>
      </section>

      {/* FORM + CONTACT */}
      <section className="pb-24 sm:pb-32">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Form */}
            <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <h2 className="text-2xl font-bold mb-1">Tell us about your gym</h2>
              <p className="text-sm text-white/50 mb-7">
                We reply on WhatsApp within 24 hours.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/60 mb-2 uppercase tracking-wide">
                      Your name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-2 uppercase tracking-wide">
                      Gym name
                    </label>
                    <input
                      type="text"
                      name="gym_name"
                      required
                      value={form.gym_name}
                      onChange={handleChange}
                      placeholder="Your gym"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/60 mb-2 uppercase tracking-wide">
                      Phone (WhatsApp)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 93543 49118"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-2 uppercase tracking-wide">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Bangalore / Mumbai / …"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-2 uppercase tracking-wide">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@gym.com"
                    className={inputCls}
                  />
                </div>

                {status === 'error' && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-full bg-lime-400 text-black font-bold hover:bg-lime-300 hover:shadow-[0_0_40px_rgba(163,230,53,0.4)] disabled:opacity-50 disabled:cursor-wait transition-all"
                >
                  {status === 'loading' ? 'Sending…' : 'Request demo'}
                  {status !== 'loading' && <ArrowRight className="w-4 h-4" />}
                </button>

                <p className="text-xs text-white/40 text-center">
                  Or just{' '}
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lime-400 hover:text-lime-300 underline underline-offset-2"
                  >
                    message us on WhatsApp
                  </a>{' '}
                  — fastest reply.
                </p>
              </form>
            </div>

            {/* Contact */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold">Talk to us directly</h2>

              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('cta_click', { location: 'contact', cta: 'whatsapp' })}
                className="block rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 p-6 hover:bg-[#25D366]/15 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#25D366] flex items-center justify-center shadow-lg shadow-[#25D366]/30">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-white">WhatsApp</div>
                    <div className="text-sm text-white/60">Fastest · usually under 1 hour</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/40 ml-auto group-hover:text-[#25D366] transition-colors" />
                </div>
              </a>

              <a
                href="tel:+919354349118"
                className="block rounded-2xl bg-white/[0.02] border border-white/10 p-5 hover:border-lime-400/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-lime-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">+91 93543 49118</div>
                    <div className="text-xs text-white/50">Call between 9 AM – 9 PM IST</div>
                  </div>
                </div>
              </a>

              <a
                href="mailto:info@activehq.fit"
                className="block rounded-2xl bg-white/[0.02] border border-white/10 p-5 hover:border-lime-400/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-lime-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">info@activehq.fit</div>
                    <div className="text-xs text-white/50">Email anytime</div>
                  </div>
                </div>
              </a>

              <div className="flex items-center gap-3 text-white/50 text-sm px-1">
                <MapPin className="w-4 h-4" />
                <span>Gurgaon, India · serving gyms across India</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
