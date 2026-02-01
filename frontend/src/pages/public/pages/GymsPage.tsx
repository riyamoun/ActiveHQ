import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { gyms, locations } from '../data';

const sortOptions = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Rating: High to Low' },
];

export function GymsPage() {
  const [query, setQuery] = useState('');
  const [selectedLocalities, setSelectedLocalities] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState('price-asc');

  const filtered = useMemo(() => {
    let list = gyms.filter((gym) => {
      const matchesQuery =
        gym.name.toLowerCase().includes(query.toLowerCase()) ||
        gym.locality.toLowerCase().includes(query.toLowerCase());

      const matchesLocality =
        selectedLocalities.length === 0 || selectedLocalities.includes(gym.locality);

      const matchesType =
        selectedTypes.length === 0 || selectedTypes.includes(gym.centerType);

      const matchesMin = minPrice === '' || gym.monthlyCost >= minPrice;
      const matchesMax = maxPrice === '' || gym.monthlyCost <= maxPrice;

      return matchesQuery && matchesLocality && matchesType && matchesMin && matchesMax;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.monthlyCost - b.monthlyCost;
      if (sortBy === 'price-desc') return b.monthlyCost - a.monthlyCost;
      if (sortBy === 'rating-desc') return b.rating - a.rating;
      return 0;
    });

    return list;
  }, [query, selectedLocalities, selectedTypes, minPrice, maxPrice, sortBy]);

  const toggleLocality = (loc: string) => {
    setSelectedLocalities((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Gyms in Gurgaon</h1>
        <div className="text-sm text-slate-400">{filtered.length} gyms found</div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filter sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-5">
            <div>
              <label className="text-xs text-slate-400">Search</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Gym name or locality"
                className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <div className="text-xs text-slate-400 mb-2">Locality</div>
              <div className="space-y-2">
                {locations.localities.map((loc) => (
                  <label key={loc} className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={selectedLocalities.includes(loc)}
                      onChange={() => toggleLocality(loc)}
                    />
                    {loc}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 mb-2">Center Type</div>
              <div className="space-y-2">
                {locations.centerTypes.map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => toggleType(type)}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 mb-2">Monthly Price</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 mb-2">Sort</div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* Catalog list */}
        <section className="lg:col-span-3">
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((gym) => (
              <Link
                key={gym.id}
                to={`/gyms/${gym.id}`}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-lg ${gym.logoColor} flex items-center justify-center text-white font-semibold`}
                  >
                    {gym.logoText}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{gym.name}</div>
                    <div className="text-xs text-slate-400 mt-1">{gym.address}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-emerald-400 text-sm">₹{gym.monthlyCost}/month</span>
                      <span className="text-xs text-slate-500">Rating {gym.rating}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {gym.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
