import { useParams, Link } from 'react-router-dom';
import { gyms } from '../data';

export function GymDetailPage() {
  const { id } = useParams();
  const gym = gyms.find((g) => g.id === id);

  if (!gym) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <p className="text-slate-400">Gym not found.</p>
        <Link to="/gyms" className="text-emerald-400">Back to gyms</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="h-56 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 mb-4" />
          <h1 className="text-2xl font-semibold">{gym.name}</h1>
          <p className="text-slate-400 text-sm mt-1">{gym.address}</p>
          <div className="text-emerald-400 text-sm mt-3">₹{gym.monthlyCost}/month</div>

          <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="text-sm font-medium mb-3">Packages</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {gym.packages.map((p) => (
                <div key={p.title} className="border border-slate-800 rounded-lg p-3">
                  <div className="text-white text-sm">{p.title}</div>
                  <div className="text-emerald-400 text-sm mt-1">₹{p.price}</div>
                  <div className="text-slate-500 text-xs mt-1">{p.duration}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="text-sm font-medium mb-3">Facilities</h2>
            <div className="flex flex-wrap gap-2">
              {gym.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-fit">
          <h3 className="text-sm font-medium mb-3">Contact gym</h3>
          <p className="text-slate-400 text-sm">Call or WhatsApp to check availability.</p>
          <div className="mt-4 space-y-2">
            <button className="w-full py-2 rounded-lg bg-emerald-600 text-white text-sm">Call now</button>
            <button className="w-full py-2 rounded-lg bg-slate-800 text-white text-sm">WhatsApp</button>
          </div>
        </div>
      </div>
    </div>
  );
}
