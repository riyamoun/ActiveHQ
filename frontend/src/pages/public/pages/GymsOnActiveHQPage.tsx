import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';

const stories = [
  {
    name: 'FitFirst Gym',
    location: 'Sector 14, Gurgaon',
    members: '250+',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',
    quote: 'Renewals increased by 40% in the first quarter. The system pays for itself.',
    owner: 'Rajesh Verma',
  },
  {
    name: 'Iron District',
    location: 'DLF Phase 2',
    members: '180+',
    image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80',
    quote: 'Zero cash mismatch since we started. Daily closing takes 5 minutes now.',
    owner: 'Amit Kapoor',
  },
  {
    name: 'PowerHouse Fitness',
    location: 'Sohna Road',
    members: '320+',
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80',
    quote: 'Managing two locations from one dashboard changed everything for us.',
    owner: 'Vikram Singh',
  },
  {
    name: 'FlexZone',
    location: 'Sector 29',
    members: '150+',
    image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&q=80',
    quote: 'Started organized from day one. Every member tracked from the beginning.',
    owner: 'Priya Sharma',
  },
];

export function GymsOnActiveHQPage() {
  return (
    <div className="bg-white text-slate-900">
      {/* ═══════════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative h-[50vh] min-h-[350px] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
        
        <div className="relative max-w-7xl mx-auto px-8">
          <p className="text-emerald-400 text-sm tracking-[0.3em] uppercase mb-6">
            Success Stories
          </p>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-[1.1] max-w-2xl">
            Real gyms.
            <br />
            <span className="font-medium">Real results.</span>
          </h1>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          INTRO
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <p className="text-xl md:text-2xl font-light text-slate-600 leading-relaxed">
            From neighborhood fitness centers to premium studios, 
            these gym owners transformed their operations with ActiveHQ.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STORIES GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {stories.map((story, i) => (
              <div key={i} className="group">
                {/* Image */}
                <div 
                  className="aspect-[3/2] rounded-xl bg-cover bg-center mb-6 overflow-hidden"
                  style={{ backgroundImage: `url('${story.image}')` }}
                >
                  <div className="w-full h-full bg-black/20 group-hover:bg-black/40 transition-colors" />
                </div>
                
                {/* Content */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-medium text-slate-900">{story.name}</h3>
                    <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                      <MapPin className="w-3 h-3" />
                      {story.location}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-600 font-medium">{story.members}</div>
                    <div className="text-slate-500 text-sm">members</div>
                  </div>
                </div>
                
                <blockquote className="text-slate-600 italic mb-3">
                  "{story.quote}"
                </blockquote>
                <div className="text-slate-400 text-sm">— {story.owner}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '50+', label: 'Gyms' },
              { value: '15,000+', label: 'Members' },
              { value: '₹3Cr+', label: 'Tracked' },
              { value: '40%', label: 'Avg. Growth' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-light text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500 tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURED QUOTE
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-32">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto mb-8 flex items-center justify-center">
            <span className="text-3xl text-slate-400">"</span>
          </div>
          <blockquote className="text-2xl md:text-3xl font-light text-slate-700 leading-relaxed mb-8">
            ActiveHQ didn't just organize our gym — it changed how we think about 
            running a business. We're finally in control.
          </blockquote>
          <div>
            <div className="font-medium text-slate-900">Vikram Singh</div>
            <div className="text-slate-500 text-sm">PowerHouse Fitness</div>
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
            backgroundImage: `url('https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="relative max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-light text-white leading-tight mb-8">
            Your story could be
            <br />
            <span className="font-medium">next</span>
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
