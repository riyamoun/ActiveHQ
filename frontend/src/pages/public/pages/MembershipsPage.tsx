import { membershipPlans } from '../data';

export function MembershipsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Memberships</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {membershipPlans.map((plan) => (
          <div key={plan.title} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-white font-medium text-lg">{plan.title}</div>
            <div className="text-emerald-400 text-xl mt-2">₹{plan.price}</div>
            <ul className="text-sm text-slate-400 mt-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
