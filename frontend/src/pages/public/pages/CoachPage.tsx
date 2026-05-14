import { useMemo, useState } from 'react';
import {
  Activity as ActivityIcon,
  Apple,
  Dumbbell,
  Flame,
  Droplets,
  Sparkles,
  ChevronRight,
  Share2,
  Calculator,
  Brain,
  Trophy,
  Target,
  Zap,
  Heart,
  ArrowRight,
} from 'lucide-react';
import { SeoMeta } from '@/components/seo/SeoMeta';
import { Reveal } from '@/components/Reveal';
import {
  generatePlan,
  buildWhatsAppShare,
  calculate1RM,
  type CoachInput,
  type CoachPlan,
  type Sex,
  type Goal,
  type Level,
  type Equipment,
  type Diet,
  type Activity,
} from '@/lib/coach';
import { trackEvent } from '@/lib/analytics';

const ACTIVITIES: { value: Activity; label: string; sub: string }[] = [
  { value: 'sedentary', label: 'Sedentary', sub: 'Desk job, no exercise' },
  { value: 'light', label: 'Light', sub: '1–3 sessions/wk' },
  { value: 'moderate', label: 'Moderate', sub: '3–5 sessions/wk' },
  { value: 'active', label: 'Active', sub: '6–7 sessions/wk' },
  { value: 'athlete', label: 'Athlete', sub: '2x daily training' },
];

const GOALS: { value: Goal; label: string; tag: string }[] = [
  { value: 'lose', label: 'Lose fat', tag: 'cut' },
  { value: 'maintain', label: 'Maintain', tag: 'recomp' },
  { value: 'gain', label: 'Build muscle', tag: 'bulk' },
];

const DIETS: { value: Diet; label: string; emoji: string }[] = [
  { value: 'omnivore', label: 'Omnivore', emoji: '🍗' },
  { value: 'eggetarian', label: 'Eggetarian', emoji: '🥚' },
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
];

export function CoachPage() {
  const [input, setInput] = useState<CoachInput>({
    sex: 'male',
    age: 26,
    heightCm: 175,
    weightKg: 78,
    activity: 'moderate',
    goal: 'lose',
    level: 'beginner',
    equipment: 'gym',
    diet: 'omnivore',
    daysPerWeek: 4,
  });
  const [plan, setPlan] = useState<CoachPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [oneRM, setOneRM] = useState({ weight: 60, reps: 5 });

  const oneRepMax = useMemo(
    () => calculate1RM(oneRM.weight, oneRM.reps),
    [oneRM.weight, oneRM.reps],
  );

  function update<K extends keyof CoachInput>(key: K, value: CoachInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGenerate() {
    setGenerating(true);
    trackEvent('coach_plan_generate', { goal: input.goal, diet: input.diet });
    await new Promise((r) => setTimeout(r, 750)); // small UX delay so the AI feels real
    const next = generatePlan(input);
    setPlan(next);
    setGenerating(false);
    setTimeout(() => {
      document.getElementById('coach-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  return (
    <div className="bg-black text-white">
      <SeoMeta
        title="AI Coach — Free Diet & Workout Plan in 60 seconds | ActiveHQ"
        description="Free AI coach for Indians. BMI, BMR/TDEE, custom Indian diet plan, gym or home workout, 1-rep max — built on real fitness science. No signup needed."
        path="/coach"
      />

      {/* ═════════════════════════ HERO ════════════════════════ */}
      <section className="relative pt-24 pb-16 sm:pb-20 overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-lime-400/15 blur-[160px] rounded-full animate-ambient" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#25D366]/10 blur-[140px] rounded-full animate-ambient" style={{ animationDelay: '4s' }} />
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <Reveal variant="up">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-lime-400/30 bg-lime-400/5 mb-7">
                  <Brain className="w-3.5 h-3.5 text-lime-400" />
                  <span className="text-xs tracking-[0.2em] uppercase text-lime-400 font-medium">
                    AI Coach · Free · No signup
                  </span>
                </div>
              </Reveal>

              <Reveal variant="up" delay={80}>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight">
                  Your <span className="text-lime-400">personal coach.</span>
                  <br />
                  <span className="text-white/40 font-light">In 60 seconds.</span>
                </h1>
              </Reveal>

              <Reveal variant="up" delay={150}>
                <p className="mt-8 text-lg sm:text-xl text-white/70 leading-relaxed max-w-2xl">
                  Diet plan tuned to your goal, body and Indian eating habits.
                  Workout split for home or gym. Macros, BMI, 1-rep max — all in one place.
                  <span className="text-lime-400"> Free. Forever.</span>
                </p>
              </Reveal>

              <Reveal variant="up" delay={220}>
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <a
                    href="#builder"
                    onClick={() => trackEvent('coach_hero_cta_click', { cta: 'builder' })}
                    className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-lime-400 text-black font-bold text-base hover:bg-lime-300 hover:shadow-[0_0_40px_rgba(163,230,53,0.5)] transition-all"
                  >
                    Build my free plan
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <div className="flex items-center gap-3 text-white/60 text-sm">
                    <span className="flex -space-x-2">
                      {['bg-lime-400', 'bg-emerald-400', 'bg-[#25D366]'].map((c, i) => (
                        <span key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-black`} />
                      ))}
                    </span>
                    <span>Built on ACSM, ISSN &amp; NSCA science</span>
                  </div>
                </div>
              </Reveal>

              {/* Feature pills */}
              <Reveal variant="up" delay={300}>
                <div className="mt-12 flex flex-wrap gap-2">
                  {[
                    { Icon: Calculator, label: 'BMI + body comp' },
                    { Icon: Flame, label: 'Macros / TDEE' },
                    { Icon: Apple, label: 'Indian diet plan' },
                    { Icon: Dumbbell, label: 'Workout split' },
                    { Icon: Trophy, label: '1-rep max' },
                    { Icon: Droplets, label: 'Hydration goal' },
                  ].map(({ Icon, label }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
                      <Icon className="w-3.5 h-3.5 text-lime-400" />
                      {label}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Live result preview */}
            <div className="lg:col-span-5">
              <Reveal variant="scale" delay={200}>
                <CoachPreview />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ BENEFITS STRIP ════════════════════ */}
      <section className="border-y border-white/10 py-10 overflow-hidden">
        <div className="flex gap-8 sm:gap-12 animate-marquee whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-white/40 text-sm tracking-wide">
              <span className="w-1 h-1 rounded-full bg-lime-400" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ═══════════════════════ BUILDER ════════════════════════ */}
      <section id="builder" className="relative py-20 sm:py-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-lime-400/5 blur-[180px] rounded-full" />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
          <Reveal variant="up" className="max-w-2xl mb-12">
            <p className="text-xs tracking-[0.3em] uppercase text-lime-400 mb-4">
              The builder
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
              Tell us about you.
              <br />
              <span className="text-white/40 font-light">We do the rest.</span>
            </h2>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Form */}
            <Reveal variant="up" delay={80}>
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 space-y-7">
                {/* Sex */}
                <Section title="Sex" icon={<ActivityIcon className="w-4 h-4" />}>
                  <SegmentedRow
                    value={input.sex}
                    onChange={(v) => update('sex', v as Sex)}
                    options={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                    ]}
                  />
                </Section>

                {/* Age / height / weight */}
                <Section title="Body" icon={<Calculator className="w-4 h-4" />}>
                  <div className="grid grid-cols-3 gap-3">
                    <NumField label="Age" value={input.age} onChange={(v) => update('age', v)} min={12} max={90} suffix="yr" />
                    <NumField label="Height" value={input.heightCm} onChange={(v) => update('heightCm', v)} min={120} max={230} suffix="cm" />
                    <NumField label="Weight" value={input.weightKg} onChange={(v) => update('weightKg', v)} min={30} max={250} suffix="kg" />
                  </div>
                </Section>

                {/* Activity */}
                <Section title="Activity level" icon={<Zap className="w-4 h-4" />}>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {ACTIVITIES.map((a) => (
                      <Pill
                        key={a.value}
                        active={input.activity === a.value}
                        onClick={() => update('activity', a.value)}
                        title={a.label}
                        sub={a.sub}
                      />
                    ))}
                  </div>
                </Section>

                {/* Goal */}
                <Section title="Goal" icon={<Target className="w-4 h-4" />}>
                  <div className="grid grid-cols-3 gap-2">
                    {GOALS.map((g) => (
                      <Pill
                        key={g.value}
                        active={input.goal === g.value}
                        onClick={() => update('goal', g.value)}
                        title={g.label}
                        sub={g.tag}
                      />
                    ))}
                  </div>
                </Section>

                {/* Diet */}
                <Section title="Diet preference" icon={<Apple className="w-4 h-4" />}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DIETS.map((d) => (
                      <Pill
                        key={d.value}
                        active={input.diet === d.value}
                        onClick={() => update('diet', d.value)}
                        title={`${d.emoji} ${d.label}`}
                      />
                    ))}
                  </div>
                </Section>

                {/* Equipment & days */}
                <Section title="Training setup" icon={<Dumbbell className="w-4 h-4" />}>
                  <SegmentedRow
                    value={input.equipment}
                    onChange={(v) => update('equipment', v as Equipment)}
                    options={[
                      { value: 'home', label: 'Home / bodyweight' },
                      { value: 'gym', label: 'Full gym' },
                    ]}
                  />
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="text-white/60">Days per week</span>
                      <span className="text-white font-semibold">{input.daysPerWeek} days</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={6}
                      value={input.daysPerWeek}
                      onChange={(e) => update('daysPerWeek', Number(e.target.value))}
                      className="w-full accent-lime-400"
                    />
                  </div>
                </Section>

                {/* Level */}
                <Section title="Experience" icon={<Trophy className="w-4 h-4" />}>
                  <div className="grid grid-cols-3 gap-2">
                    {(['beginner', 'intermediate', 'advanced'] as Level[]).map((l) => (
                      <Pill
                        key={l}
                        active={input.level === l}
                        onClick={() => update('level', l)}
                        title={l[0].toUpperCase() + l.slice(1)}
                      />
                    ))}
                  </div>
                </Section>

                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="relative w-full py-4 rounded-full bg-lime-400 text-black font-bold hover:bg-lime-300 disabled:opacity-60 transition-all overflow-hidden group"
                >
                  <span className="relative inline-flex items-center justify-center gap-2">
                    {generating ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                        AI is thinking…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate my AI plan
                      </>
                    )}
                  </span>
                </button>
              </div>
            </Reveal>

            {/* Side rail — 1RM + tips */}
            <div className="space-y-6">
              <Reveal variant="up" delay={120}>
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-lime-400" />
                      <span className="text-xs tracking-[0.25em] uppercase text-white/50">
                        1-rep max
                      </span>
                    </div>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-lime-400">Epley</span>
                  </div>

                  <div className="text-5xl font-bold text-lime-400">
                    {oneRepMax || '—'}{' '}
                    <span className="text-white/40 text-xl font-light">kg</span>
                  </div>
                  <div className="text-xs text-white/40 mt-1">Estimated 1-rep max</div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <NumField
                      label="Weight"
                      value={oneRM.weight}
                      onChange={(v) => setOneRM((s) => ({ ...s, weight: v }))}
                      min={5}
                      max={500}
                      suffix="kg"
                    />
                    <NumField
                      label="Reps"
                      value={oneRM.reps}
                      onChange={(v) => setOneRM((s) => ({ ...s, reps: v }))}
                      min={1}
                      max={20}
                      suffix=""
                    />
                  </div>

                  {oneRepMax > 0 && (
                    <div className="mt-5 space-y-1.5 text-xs">
                      <div className="flex justify-between text-white/50">
                        <span>5RM (working set)</span>
                        <span className="text-white">{Math.round(oneRepMax * 0.85)} kg</span>
                      </div>
                      <div className="flex justify-between text-white/50">
                        <span>8RM (volume)</span>
                        <span className="text-white">{Math.round(oneRepMax * 0.78)} kg</span>
                      </div>
                      <div className="flex justify-between text-white/50">
                        <span>12RM (hypertrophy)</span>
                        <span className="text-white">{Math.round(oneRepMax * 0.7)} kg</span>
                      </div>
                    </div>
                  )}
                </div>
              </Reveal>

              <Reveal variant="up" delay={180}>
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-950/40 via-black to-black p-6 sm:p-8 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-lime-400/10 blur-[60px] rounded-full" />
                  <div className="relative">
                    <Brain className="w-6 h-6 text-lime-400 mb-3" />
                    <h3 className="text-lg font-bold">Why is this AI?</h3>
                    <p className="mt-3 text-sm text-white/60 leading-relaxed">
                      Our coach uses the same formulas that elite trainers use —
                      Mifflin-St Jeor for BMR, ISSN protein guidelines, NSCA
                      programming — applied to your specific body, goal, and diet.
                      It's deterministic, so the plan is always defensible.
                    </p>
                    <ul className="mt-4 space-y-1.5 text-xs text-white/50">
                      <li>· No vague "drink more water" advice</li>
                      <li>· No premium paywall</li>
                      <li>· No "create account" before you see anything</li>
                    </ul>
                  </div>
                </div>
              </Reveal>

              <Reveal variant="up" delay={240}>
                <div className="rounded-3xl border border-[#25D366]/30 bg-[#25D366]/5 p-6">
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-[#25D366] mt-1" />
                    <div>
                      <h3 className="font-bold text-white">Share your plan on WhatsApp</h3>
                      <p className="text-sm text-white/60 mt-1">
                        Send it to your trainer, friend, or your future self.
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ RESULT ════════════════════════ */}
      {plan && <CoachResult plan={plan} />}

      {/* ═══════════════════ DIFFERENTIATORS ════════════════════ */}
      <section className="py-24 sm:py-28 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal variant="up" className="max-w-2xl mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-lime-400 mb-4">
              What no one else does
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
              Gym OS + AI coach.
              <br />
              <span className="text-white/40 font-light">One product.</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { Icon: Sparkles, title: 'Free without signup', body: 'See your full plan, macros and workout before you ever create an account. Most "free" coach apps gate the plan behind a paywall.' },
              { Icon: Brain, title: 'Indian diet, not Western', body: 'Roti, dal, paneer, sprouts, khichdi — your plan looks like food your mother would actually cook, not chicken-and-broccoli boxes.' },
              { Icon: Dumbbell, title: 'Home OR gym, both ready', body: "One toggle and the entire workout swaps to bodyweight or full-gym variants. Travel? Switch back any day." },
              { Icon: Apple, title: 'Plan + tracker + gym, one app', body: 'You can keep the coach for yourself, or attach it to a gym membership at the same place. Owner, trainer, member — one product.' },
              { Icon: Droplets, title: 'India-aware hydration', body: 'Most calculators give 2L by default. We adjust for body weight + training days + (coming soon) climate.' },
              { Icon: Trophy, title: 'Lifts you can trust', body: 'Working-set / hypertrophy / endurance loads auto-calculated from your 1RM. Real strength coaching maths, free.' },
            ].map(({ Icon, title, body }, idx) => (
              <Reveal key={title} variant="up" delay={idx * 60}>
                <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-lime-400/40 transition-colors tilt">
                  <div className="w-11 h-11 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-lime-400" />
                  </div>
                  <h3 className="text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm text-white/60 leading-relaxed">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FINAL CTA ═══════════════════════ */}
      <section className="relative py-24 sm:py-32 border-t border-white/10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-lime-400/10 blur-[180px] rounded-full animate-ambient" />
        </div>
        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <Reveal variant="up">
            <h2 className="text-5xl sm:text-6xl font-bold leading-tight">
              Take it for a spin.{' '}
              <span className="text-lime-400">Free.</span>
            </h2>
            <p className="mt-6 text-lg text-white/60">
              No signup. No card. No email. Just your plan.
            </p>
            <a
              href="#builder"
              className="inline-flex items-center justify-center gap-2 mt-10 px-8 py-4 rounded-full bg-lime-400 text-black font-bold hover:bg-lime-300 hover:shadow-[0_0_40px_rgba(163,230,53,0.5)] transition-all"
            >
              Build my AI plan
              <ArrowRight className="w-4 h-4" />
            </a>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════════════════════════ */

const marqueeItems = [
  'BMI calculator',
  'Body fat estimate',
  'Mifflin–St Jeor BMR',
  'TDEE + activity',
  'ISSN protein targets',
  'Indian-friendly meals',
  'Home / gym split',
  'Push · Pull · Legs',
  'Epley 1-rep max',
  'Working-set weights',
  'Hydration target',
  'WhatsApp share',
  'No signup needed',
  'Free forever',
];

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-white/60">
        <span className="text-lime-400">{icon}</span>
        <span className="text-xs tracking-[0.2em] uppercase">{title}</span>
      </div>
      {children}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  suffix: string;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] tracking-wider uppercase text-white/40 mb-1.5">{label}</span>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return;
            onChange(Math.max(min, Math.min(max, n)));
          }}
          min={min}
          max={max}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-lg font-semibold focus:outline-none focus:border-lime-400/60 focus:ring-2 focus:ring-lime-400/20 transition"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function SegmentedRow<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/40 border border-white/10">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
            value === opt.value
              ? 'bg-lime-400 text-black'
              : 'text-white/60 hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Pill({
  active,
  onClick,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  sub?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
        active
          ? 'bg-lime-400/10 border-lime-400/60 text-white'
          : 'bg-white/[0.02] border-white/10 text-white/60 hover:border-white/30 hover:text-white'
      }`}
    >
      <div className="text-sm font-semibold">{title}</div>
      {sub && <div className="text-[10px] text-white/40 mt-0.5">{sub}</div>}
    </button>
  );
}

function CoachPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-lime-400/15 blur-[80px] rounded-full" />
      <div className="relative rounded-3xl border border-white/10 bg-zinc-950 p-6 sm:p-7 shadow-2xl shadow-black/60 overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-400 to-transparent animate-scan"
          aria-hidden
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-xs tracking-[0.25em] uppercase text-white/50">Live preview</span>
          </div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-lime-400 bg-lime-400/10 px-2 py-1 rounded-full border border-lime-400/20">AI</span>
        </div>

        <div className="mt-5 text-[10px] uppercase tracking-[0.2em] text-white/40">Your plan</div>
        <div className="text-2xl font-bold text-white mt-1 animate-caret">
          12-week lean cut
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          {[
            { l: 'Calories', v: '2,140', c: 'text-lime-400' },
            { l: 'Protein', v: '156 g', c: 'text-emerald-400' },
            { l: 'Water', v: '3.2 L', c: 'text-cyan-400' },
          ].map((s) => (
            <div key={s.l} className="rounded-xl bg-black/40 border border-white/5 p-3">
              <div className="text-[10px] text-white/40 uppercase tracking-wide">{s.l}</div>
              <div className={`text-lg font-bold ${s.c} mt-1`}>{s.v}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl bg-black/40 border border-white/5 p-3 space-y-2">
          {[
            { dot: 'bg-lime-400', label: 'Breakfast · 3-egg omelette + rotis' },
            { dot: 'bg-emerald-400', label: 'Workout · Push (chest, shoulders, tri)' },
            { dot: 'bg-[#25D366]', label: 'WhatsApp · plan delivered' },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2.5">
              <span className={`w-1.5 h-1.5 rounded-full ${row.dot}`} />
              <span className="text-xs text-white/80 flex-1 truncate">{row.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-4 left-4 px-3 py-2 rounded-xl bg-lime-400 text-black text-xs font-bold shadow-xl flex items-center gap-1.5 animate-float">
        <Sparkles className="w-3.5 h-3.5" />
        Built in 750 ms
      </div>
    </div>
  );
}

function CoachResult({ plan }: { plan: CoachPlan }) {
  const shareUrl = buildWhatsAppShare(plan);

  return (
    <section id="coach-result" className="relative py-20 sm:py-28 border-t border-white/10 scroll-mt-20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-lime-400/10 blur-[160px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <Reveal variant="up">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-lime-400 mb-4">
                Your plan · ready
              </p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
                <span className="text-lime-400">{plan.badge}.</span>
                <br />
                <span className="text-white/40 font-light">Generated for you.</span>
              </h2>
            </div>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('coach_plan_share', { goal: plan.badge })}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#25D366] text-white font-bold hover:bg-[#1ebd5a] transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share on WhatsApp
            </a>
          </div>
        </Reveal>

        {/* Stats */}
        <Reveal variant="up" delay={80}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
            <StatCard label="BMI" value={plan.bmi.toString()} sub={plan.bmiBand} accent="text-lime-400" />
            <StatCard label="BMR" value={plan.bmr.toLocaleString()} sub="kcal at rest" accent="text-white" />
            <StatCard label="TDEE" value={plan.tdee.toLocaleString()} sub="daily burn" accent="text-white" />
            <StatCard label="Calories" value={plan.macros.calories.toLocaleString()} sub="goal target" accent="text-lime-400" />
          </div>
        </Reveal>

        {/* Macros */}
        <Reveal variant="up" delay={140}>
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 mb-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-lime-400" />
                <span className="text-xs tracking-[0.25em] uppercase text-white/50">Macro split</span>
              </div>
              <div className="text-xs text-white/40">
                {plan.macros.calories} kcal · ISSN guidance
              </div>
            </div>

            <MacroBar
              protein={plan.macros.protein_g}
              carbs={plan.macros.carbs_g}
              fat={plan.macros.fat_g}
            />

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MacroPill label="Protein" value={`${plan.macros.protein_g} g`} kcal={plan.macros.protein_g * 4} color="bg-lime-400" />
              <MacroPill label="Carbs" value={`${plan.macros.carbs_g} g`} kcal={plan.macros.carbs_g * 4} color="bg-emerald-400" />
              <MacroPill label="Fat" value={`${plan.macros.fat_g} g`} kcal={plan.macros.fat_g * 9} color="bg-amber-400" />
              <MacroPill label="Water" value={`${plan.macros.water_l} L`} kcal={0} color="bg-cyan-400" />
            </div>
          </div>
        </Reveal>

        {/* Diet + Workout */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Reveal variant="up" delay={180}>
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-5">
                <Apple className="w-4 h-4 text-lime-400" />
                <span className="text-xs tracking-[0.25em] uppercase text-white/50">Diet plan</span>
              </div>
              <div className="space-y-3">
                {plan.meals.map((m) => (
                  <div key={m.slot} className="rounded-xl bg-black/40 border border-white/5 p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-[10px] tracking-[0.2em] uppercase text-lime-400">{m.slot} · {m.time}</div>
                      <div className="text-[10px] text-white/40">~{m.approxKcal} kcal</div>
                    </div>
                    <div className="text-white font-semibold">{m.title}</div>
                    {m.items.length > 0 && (
                      <ul className="mt-2 text-xs text-white/60 space-y-0.5">
                        {m.items.map((it) => (
                          <li key={it}>· {it}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal variant="up" delay={220}>
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-5">
                <Dumbbell className="w-4 h-4 text-lime-400" />
                <span className="text-xs tracking-[0.25em] uppercase text-white/50">Workout · {plan.workout.length}-day split</span>
              </div>
              <div className="space-y-3">
                {plan.workout.map((d) => (
                  <details
                    key={d.day}
                    className="group rounded-xl bg-black/40 border border-white/5 p-4 [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <div>
                        <div className="text-[10px] tracking-[0.2em] uppercase text-lime-400">{d.day}</div>
                        <div className="text-white font-semibold">{d.focus}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/40 group-open:rotate-90 transition-transform" />
                    </summary>
                    <ul className="mt-3 space-y-2 text-sm text-white/70">
                      {d.exercises.map((ex) => (
                        <li key={ex.name} className="flex items-start justify-between gap-3 border-t border-white/5 pt-2">
                          <div>
                            <div className="text-white">{ex.name}</div>
                            {ex.note && <div className="text-[10px] text-white/40 mt-0.5">{ex.note}</div>}
                          </div>
                          <div className="text-xs text-white/50 whitespace-nowrap">
                            {ex.sets} × {ex.reps} · {ex.rest}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Insights */}
        <Reveal variant="up" delay={260}>
          <div className="mt-10 rounded-3xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 via-black to-black p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <Brain className="w-4 h-4 text-lime-400" />
              <span className="text-xs tracking-[0.25em] uppercase text-lime-400">Coach insights</span>
            </div>
            <ul className="space-y-3">
              {plan.insights.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-white/80">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-lime-400 flex-shrink-0" />
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Disclaimer */}
        <p className="mt-8 text-xs text-white/40 max-w-3xl">
          This plan is an educational guide based on standard fitness science (Mifflin-St Jeor, ISSN, NSCA).
          If you have medical conditions, are pregnant, or are managing injuries, consult your physician
          or a certified trainer before starting any new diet or workout program.
        </p>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="text-[10px] tracking-[0.2em] uppercase text-white/40">{label}</div>
      <div className={`text-3xl font-bold mt-1.5 ${accent}`}>{value}</div>
      <div className="text-xs text-white/50 mt-1 capitalize">{sub}</div>
    </div>
  );
}

function MacroBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const pKcal = protein * 4;
  const cKcal = carbs * 4;
  const fKcal = fat * 9;
  const total = pKcal + cKcal + fKcal || 1;
  const pPct = (pKcal / total) * 100;
  const cPct = (cKcal / total) * 100;
  const fPct = (fKcal / total) * 100;

  return (
    <div className="h-3 w-full rounded-full overflow-hidden flex bg-white/5">
      <div className="bg-lime-400" style={{ width: `${pPct}%` }} title={`Protein ${pPct.toFixed(0)}%`} />
      <div className="bg-emerald-400" style={{ width: `${cPct}%` }} title={`Carbs ${cPct.toFixed(0)}%`} />
      <div className="bg-amber-400" style={{ width: `${fPct}%` }} title={`Fat ${fPct.toFixed(0)}%`} />
    </div>
  );
}

function MacroPill({
  label,
  value,
  kcal,
  color,
}: {
  label: string;
  value: string;
  kcal: number;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-black/40 border border-white/5 p-3">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">{label}</span>
      </div>
      <div className="text-lg font-bold text-white mt-1.5">{value}</div>
      {kcal > 0 && <div className="text-[10px] text-white/40 mt-0.5">{kcal} kcal</div>}
    </div>
  );
}
