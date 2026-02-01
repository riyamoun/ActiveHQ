import { useMemo, useState } from 'react';

function getBmiStatus(bmi: number) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  if (bmi < 40) return 'Obesity';
  return 'Morbid Obesity';
}

export function BmiPage() {
  const [age, setAge] = useState(28);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(72);

  const bmi = useMemo(() => {
    const h = height / 100;
    return weight / (h * h);
  }, [height, weight]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">BMI Calculator</h1>
      <p className="text-slate-400 text-sm mb-6">
        Simple BMI calculator commonly used by gyms in India.
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <label className="text-sm text-slate-400">
            Age (years)
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </label>
          <label className="text-sm text-slate-400">
            Height (cm)
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </label>
          <label className="text-sm text-slate-400">
            Weight (kg)
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </label>
        </div>

        <div className="mt-6 bg-slate-950 border border-slate-800 rounded-lg p-4">
          <p className="text-slate-400 text-sm">Your BMI</p>
          <p className="text-white text-3xl font-semibold">{bmi.toFixed(1)}</p>
          <p className="text-emerald-400 text-sm mt-1">{getBmiStatus(bmi)}</p>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Normal range: 18.5 – 24.9
        </div>
      </div>
    </div>
  );
}
