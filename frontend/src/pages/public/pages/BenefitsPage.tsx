import { benefits } from '../data';

export function BenefitsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Benefits for Gym Owners</h1>
      <p className="text-slate-400 text-sm mb-6">
        Made by gym owners and techies for gym owners. Practical, local, and easy to use.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        {benefits.map((b) => (
          <div key={b} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-white">{b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
