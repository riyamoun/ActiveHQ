import { Check, IndianRupee, MessageCircle, MapPin, Clock, Shield } from 'lucide-react';

const facts = [
  { icon: Check, text: 'Used daily by real gyms' },
  { icon: IndianRupee, text: 'Cash & UPI friendly' },
  { icon: MessageCircle, text: 'WhatsApp reminders included' },
  { icon: MapPin, text: 'Built for Indian gyms' },
  { icon: Clock, text: 'Works on slow networks' },
  { icon: Shield, text: 'No technical knowledge needed' },
];

export function OperationalFacts() {
  return (
    <section className="bg-slate-900 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-4">
          {facts.map((fact, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-full"
            >
              <fact.icon className="h-4 w-4 text-emerald-500" />
              <span className="text-slate-300 text-sm">{fact.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
