import { useState } from 'react';
import { Phone, Mail, MapPin, Check } from 'lucide-react';
import axios from 'axios';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      await axios.post('/api/v1/public/demo-request', {
        ...form,
        source: 'public_site',
      });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again or call us directly.');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-8">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto mb-6 flex items-center justify-center">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-light text-slate-900 mb-4">
            Request <span className="font-medium">received</span>
          </h1>
          <p className="text-lg text-slate-600 font-light mb-8">
            We'll call you within 24 hours to schedule your personalized demo.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-full hover:bg-slate-50 transition-colors"
          >
            Back to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-slate-900">
      {/* ═══════════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="pt-12 pb-16">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <p className="text-emerald-600 text-sm tracking-[0.2em] uppercase mb-4">
            Contact
          </p>
          <h1 className="text-4xl md:text-5xl font-light text-slate-900 leading-tight mb-6">
            Let's <span className="font-medium">connect</span>
          </h1>
          <p className="text-xl text-slate-600 font-light max-w-lg mx-auto">
            Schedule a personalized demo. See how ActiveHQ 
            can transform your gym operations.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FORM + CONTACT
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Form */}
            <div>
              <h2 className="text-2xl font-light text-slate-900 mb-8">
                Request a <span className="font-medium">demo</span>
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-slate-500 mb-2">Your name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full px-0 py-3 bg-transparent border-0 border-b border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="Rajesh Verma"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-500 mb-2">Gym name</label>
                    <input
                      type="text"
                      name="gym_name"
                      value={form.gym_name}
                      onChange={handleChange}
                      required
                      className="w-full px-0 py-3 bg-transparent border-0 border-b border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="FitFirst Gym"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-500 mb-2">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-0 py-3 bg-transparent border-0 border-b border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-slate-500 mb-2">City</label>
                    <select
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="w-full px-0 py-3 bg-transparent border-0 border-b border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                    >
                      <option value="Gurgaon">Gurgaon</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Noida">Noida</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-500 mb-2">Locality</label>
                    <input
                      type="text"
                      name="locality"
                      value={form.locality}
                      onChange={handleChange}
                      className="w-full px-0 py-3 bg-transparent border-0 border-b border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="Sector 14"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-500 mb-2">Email (optional)</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-0 py-3 bg-transparent border-0 border-b border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="rajesh@email.com"
                  />
                </div>

                {status === 'error' && (
                  <div className="text-red-600 text-sm">{errorMsg}</div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-4 bg-slate-900 text-white rounded-full hover:bg-emerald-600 disabled:opacity-50 transition-all mt-8"
                >
                  {status === 'loading' ? 'Submitting...' : 'Request Demo'}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="lg:pl-8">
              <h2 className="text-2xl font-light text-slate-900 mb-8">
                Get in <span className="font-medium">touch</span>
              </h2>
              
              <div className="space-y-8 mb-12">
                <a href="tel:+919876543210" className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <Phone className="w-5 h-5 text-slate-600 group-hover:text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">+91 98765 43210</div>
                    <div className="text-slate-500 text-sm">Call or WhatsApp</div>
                  </div>
                </a>

                <a href="mailto:hello@activehq.in" className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <Mail className="w-5 h-5 text-slate-600 group-hover:text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">hello@activehq.in</div>
                    <div className="text-slate-500 text-sm">Email us anytime</div>
                  </div>
                </a>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Gurgaon, Haryana</div>
                    <div className="text-slate-500 text-sm">India</div>
                  </div>
                </div>
              </div>

              {/* Image */}
              <div 
                className="aspect-[4/3] rounded-xl bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1570829460005-c840387bb1ca?w=600&q=80')`,
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
