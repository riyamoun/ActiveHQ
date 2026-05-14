/**
 * Coach maths + AI-style plan generator.
 *
 * Everything is pure (no I/O, no network) so it can be tested and reused.
 * The plans are produced by deterministic rules grounded in established
 * fitness science (ACSM, ISSN macro guidelines, NSCA programming) — we
 * frame this as "AI Coach" because, in practice, that's exactly how most
 * commercial AI coaching apps work under the hood.
 *
 * If a real LLM is wired later, swap `generatePlan` for an async call to
 * `/api/coach/plan` and keep the same return shape.
 */

export type Sex = 'male' | 'female';
export type Goal = 'lose' | 'maintain' | 'gain';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Equipment = 'home' | 'gym';
export type Diet = 'omnivore' | 'vegetarian' | 'vegan' | 'eggetarian';
export type Activity =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'athlete';

export type CoachInput = {
  sex: Sex;
  age: number;          // years
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
  level: Level;
  equipment: Equipment;
  diet: Diet;
  daysPerWeek: number;  // 2–6
};

export type Macros = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_l: number;
  fiber_g: number;
};

export type Meal = {
  slot: string;
  time: string;
  title: string;
  items: string[];
  approxKcal: number;
};

export type WorkoutDay = {
  day: string;
  focus: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    rest: string;
    note?: string;
  }[];
};

export type CoachPlan = {
  bmi: number;
  bmiBand: 'underweight' | 'normal' | 'overweight' | 'obese';
  bmr: number;        // basal metabolic rate
  tdee: number;       // total daily energy expenditure
  macros: Macros;
  oneRepMax?: number; // only if benchKg supplied later — left undefined here
  meals: Meal[];
  workout: WorkoutDay[];
  insights: string[]; // 3–5 short coach-style pointers
  badge: string;      // headline label, e.g. "12-week lean cut"
};

/* ────────────────────────────────────────────────────────────────────
   CORE MATHS
   ──────────────────────────────────────────────────────────────────── */

const ACTIVITY_MULT: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

export function calculateBMI(weightKg: number, heightCm: number) {
  if (heightCm <= 0) return 0;
  const m = heightCm / 100;
  return +(weightKg / (m * m)).toFixed(1);
}

export function bmiBand(bmi: number): CoachPlan['bmiBand'] {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

/** Mifflin-St Jeor — the most accurate widely used BMR formula. */
export function calculateBMR(input: Pick<CoachInput, 'sex' | 'age' | 'heightCm' | 'weightKg'>) {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return Math.round(input.sex === 'male' ? base + 5 : base - 161);
}

export function calculateTDEE(input: CoachInput) {
  return Math.round(calculateBMR(input) * ACTIVITY_MULT[input.activity]);
}

export function calculateMacros(input: CoachInput): Macros {
  const tdee = calculateTDEE(input);

  // Goal-based calorie target
  let calories = tdee;
  if (input.goal === 'lose') calories = Math.round(tdee * 0.82);
  if (input.goal === 'gain') calories = Math.round(tdee * 1.12);

  // ISSN protein guidance: 1.6–2.2 g/kg for active individuals
  const protein_g = Math.round(input.weightKg * (input.goal === 'lose' ? 2.0 : 1.8));

  // Fat ~25% kcal
  const fatKcal = calories * 0.25;
  const fat_g = Math.round(fatKcal / 9);

  // Carbs fill remainder
  const proteinKcal = protein_g * 4;
  const carbs_g = Math.max(0, Math.round((calories - proteinKcal - fatKcal) / 4));

  // Water target — 35 ml/kg + 500 ml per training day
  const water_l = +(((input.weightKg * 35) + (input.daysPerWeek * 70)) / 1000).toFixed(1);

  const fiber_g = Math.round(Math.min(40, calories / 100));

  return { calories, protein_g, carbs_g, fat_g, water_l, fiber_g };
}

/** Epley 1-rep max estimate. */
export function calculate1RM(weightKg: number, reps: number) {
  if (reps < 1 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30));
}

/* ────────────────────────────────────────────────────────────────────
   MEAL TEMPLATES — Indian-friendly, diet-aware
   ──────────────────────────────────────────────────────────────────── */

type MealBank = Record<Diet, { title: string; items: string[] }[][]>; // [slot][index]

const MEAL_BANK: MealBank = {
  omnivore: [
    [ // breakfast
      { title: '3-egg veg omelette + 2 multigrain rotis', items: ['3 whole eggs', '2 multigrain rotis', '1 cup vegetable sabzi', 'Black coffee / green tea'] },
      { title: 'Chicken keema + toast', items: ['150 g chicken keema bhurji', '2 brown bread toast', '1 banana', 'Black coffee'] },
      { title: 'Oats + whey + eggs', items: ['50 g oats with milk', '1 scoop whey protein', '2 boiled eggs', 'Handful of almonds'] },
    ],
    [ // mid-morning
      { title: 'Greek-style curd + fruit', items: ['200 g hung curd / Greek yogurt', '1 small fruit (apple/pear)', '15 g mixed nuts'] },
      { title: 'Protein shake + nuts', items: ['1 scoop whey in 250 ml milk', '10 almonds', '1 dates'] },
    ],
    [ // lunch
      { title: 'Grilled chicken + dal-chawal', items: ['150 g grilled chicken', '1 katori dal', '1 cup brown rice', 'Salad with cucumber + onion'] },
      { title: 'Fish curry + rice', items: ['1 piece rohu/basa curry (low oil)', '1 cup rice', '1 katori vegetable', 'Salad'] },
      { title: 'Egg curry + roti', items: ['3 eggs in curry', '2 rotis', '1 katori sabzi', 'Salad'] },
    ],
    [ // snack
      { title: 'Sprouts chaat + chai', items: ['1 katori moong sprouts', '1 chai (without sugar)', '2 marie biscuits'] },
      { title: 'Boiled eggs + fruit', items: ['2 boiled eggs', '1 orange', 'Green tea'] },
    ],
    [ // dinner
      { title: 'Grilled fish + sabzi', items: ['150 g grilled fish', '1 katori paneer/sabzi', '1 multigrain roti', 'Salad'] },
      { title: 'Tandoori chicken + soup', items: ['150 g tandoori chicken (no oil)', '1 bowl veg soup', '1 small bowl quinoa'] },
      { title: 'Egg + dal + roti', items: ['2 egg whites + 1 whole egg bhurji', '1 katori dal', '1 roti', 'Cucumber raita'] },
    ],
  ],
  vegetarian: [
    [
      { title: 'Paneer bhurji + roti', items: ['100 g paneer bhurji', '2 multigrain rotis', '1 cup vegetable', 'Black coffee'] },
      { title: 'Oats + whey + banana', items: ['50 g oats in milk', '1 scoop whey', '1 banana', '10 almonds'] },
      { title: 'Besan chilla + curd', items: ['2 besan chillas', '1 katori curd', 'Mint chutney', 'Green tea'] },
    ],
    [
      { title: 'Curd + fruit', items: ['200 g curd', '1 fruit', '15 g nuts'] },
      { title: 'Whey + nuts', items: ['1 scoop whey in milk', '10 almonds'] },
    ],
    [
      { title: 'Paneer + dal-chawal', items: ['100 g paneer tikka', '1 katori dal', '1 cup brown rice', 'Salad'] },
      { title: 'Rajma-chawal + curd', items: ['1 katori rajma', '1 cup rice', '1 katori curd', 'Salad'] },
      { title: 'Soy chunks curry + roti', items: ['80 g soy chunks (dry) curry', '2 rotis', '1 katori sabzi', 'Salad'] },
    ],
    [
      { title: 'Sprouts chaat + chai', items: ['1 katori sprouts', '1 chai (no sugar)', '1 fruit'] },
      { title: 'Roasted chana + curd', items: ['30 g roasted chana', '1 katori curd'] },
    ],
    [
      { title: 'Paneer + sabzi + roti', items: ['100 g grilled paneer', '1 katori sabzi', '1 multigrain roti', 'Salad'] },
      { title: 'Khichdi + curd', items: ['1.5 katori moong-dal khichdi', '1 katori curd', '1 papad (roasted)'] },
      { title: 'Tofu stir-fry + quinoa', items: ['100 g tofu stir-fry', '1 small bowl quinoa', '1 bowl soup'] },
    ],
  ],
  vegan: [
    [
      { title: 'Tofu scramble + roti', items: ['100 g tofu bhurji', '2 jowar / multigrain rotis', '1 cup vegetable', 'Black coffee'] },
      { title: 'Oats + plant protein', items: ['50 g oats in plant milk', '1 scoop plant protein', '1 banana', '10 almonds'] },
      { title: 'Besan chilla + chutney', items: ['2 besan chillas', 'Mint-coriander chutney', 'Green tea'] },
    ],
    [
      { title: 'Sprouts + fruit', items: ['1 katori sprouts', '1 fruit', '15 g nuts'] },
      { title: 'Plant protein shake + nuts', items: ['1 scoop pea/soy protein in plant milk', '10 almonds'] },
    ],
    [
      { title: 'Rajma + brown rice', items: ['1 katori rajma', '1 cup brown rice', 'Salad', 'Lemon water'] },
      { title: 'Chole + roti', items: ['1 katori chole', '2 multigrain rotis', '1 cup vegetable', 'Salad'] },
      { title: 'Soy chunks + quinoa', items: ['80 g soy chunks curry', '1 small bowl quinoa', 'Salad'] },
    ],
    [
      { title: 'Roasted chana + chai (plant milk)', items: ['30 g roasted chana', '1 chai with plant milk'] },
      { title: 'Sprouts chaat', items: ['1 katori sprouts chaat', '1 fruit'] },
    ],
    [
      { title: 'Tofu stir-fry + jowar roti', items: ['100 g tofu', '1 katori veg stir-fry', '1 jowar roti', 'Salad'] },
      { title: 'Daal-chawal + sabzi', items: ['1 katori dal', '1 cup brown rice', '1 katori sabzi'] },
      { title: 'Lentil khichdi', items: ['1.5 katori moong-dal khichdi', '1 katori veg', '1 roasted papad'] },
    ],
  ],
  eggetarian: [
    [
      { title: '3-egg omelette + roti', items: ['3 whole eggs omelette', '2 multigrain rotis', '1 cup vegetable', 'Black coffee'] },
      { title: 'Boiled eggs + oats', items: ['3 boiled eggs', '40 g oats', '1 banana'] },
    ],
    [
      { title: 'Curd + fruit + nuts', items: ['200 g curd', '1 fruit', '15 g nuts'] },
      { title: 'Whey shake + almonds', items: ['1 scoop whey in milk', '10 almonds'] },
    ],
    [
      { title: 'Egg curry + dal-chawal', items: ['3 egg curry', '1 katori dal', '1 cup brown rice', 'Salad'] },
      { title: 'Paneer + dal-roti', items: ['100 g paneer tikka', '1 katori dal', '2 rotis', 'Salad'] },
    ],
    [
      { title: 'Boiled eggs + fruit', items: ['2 boiled eggs', '1 fruit', 'Green tea'] },
      { title: 'Sprouts chaat', items: ['1 katori sprouts', '1 chai'] },
    ],
    [
      { title: 'Egg bhurji + sabzi + roti', items: ['3-egg bhurji', '1 katori sabzi', '1 multigrain roti'] },
      { title: 'Paneer + soup + quinoa', items: ['100 g grilled paneer', '1 bowl soup', '1 small bowl quinoa'] },
    ],
  ],
};

const SLOT_META: { slot: string; time: string }[] = [
  { slot: 'Breakfast', time: '8:00 AM' },
  { slot: 'Mid-morning', time: '11:00 AM' },
  { slot: 'Lunch', time: '1:30 PM' },
  { slot: 'Snack', time: '5:00 PM' },
  { slot: 'Dinner', time: '8:30 PM' },
];

/* ────────────────────────────────────────────────────────────────────
   WORKOUT TEMPLATES
   ──────────────────────────────────────────────────────────────────── */

type ExerciseBank = Record<string, {
  home: { name: string; sets: number; reps: string; rest: string; note?: string }[];
  gym: { name: string; sets: number; reps: string; rest: string; note?: string }[];
}>;

const EX: ExerciseBank = {
  push: {
    home: [
      { name: 'Push-ups', sets: 4, reps: '8–15', rest: '60s' },
      { name: 'Pike push-ups (shoulders)', sets: 3, reps: '8–12', rest: '60s' },
      { name: 'Diamond push-ups (triceps)', sets: 3, reps: '8–12', rest: '60s' },
      { name: 'Dips on chair', sets: 3, reps: '10–15', rest: '60s' },
      { name: 'Plank shoulder taps', sets: 3, reps: '20 total', rest: '45s' },
    ],
    gym: [
      { name: 'Barbell bench press', sets: 4, reps: '6–10', rest: '90s' },
      { name: 'Incline DB press', sets: 3, reps: '8–12', rest: '75s' },
      { name: 'Standing OHP', sets: 3, reps: '6–10', rest: '90s' },
      { name: 'Cable triceps pushdown', sets: 3, reps: '10–15', rest: '60s' },
      { name: 'Lateral raises', sets: 3, reps: '12–15', rest: '45s' },
    ],
  },
  pull: {
    home: [
      { name: 'Pull-ups (or doorway rows)', sets: 4, reps: 'AMRAP / 8–12', rest: '90s' },
      { name: 'Inverted rows (table)', sets: 3, reps: '8–12', rest: '60s' },
      { name: 'Backpack bent-over rows', sets: 3, reps: '10–15', rest: '60s' },
      { name: 'Superman holds', sets: 3, reps: '20s', rest: '45s' },
      { name: 'Reverse snow angels', sets: 3, reps: '12', rest: '45s' },
    ],
    gym: [
      { name: 'Deadlift', sets: 4, reps: '5–8', rest: '120s', note: 'Form > weight' },
      { name: 'Lat pulldown', sets: 3, reps: '8–12', rest: '75s' },
      { name: 'Seated row', sets: 3, reps: '10–12', rest: '60s' },
      { name: 'Face pulls', sets: 3, reps: '12–15', rest: '45s' },
      { name: 'DB hammer curl', sets: 3, reps: '10–12', rest: '45s' },
    ],
  },
  legs: {
    home: [
      { name: 'Bodyweight squats', sets: 4, reps: '15–20', rest: '60s' },
      { name: 'Bulgarian split squats', sets: 3, reps: '10/side', rest: '75s' },
      { name: 'Glute bridges', sets: 3, reps: '15', rest: '45s' },
      { name: 'Reverse lunges', sets: 3, reps: '10/side', rest: '60s' },
      { name: 'Calf raises', sets: 3, reps: '20', rest: '30s' },
    ],
    gym: [
      { name: 'Back squat', sets: 4, reps: '6–10', rest: '120s' },
      { name: 'Romanian deadlift', sets: 3, reps: '8–10', rest: '90s' },
      { name: 'Leg press', sets: 3, reps: '10–12', rest: '75s' },
      { name: 'Walking lunges', sets: 3, reps: '12/side', rest: '60s' },
      { name: 'Standing calf raise', sets: 4, reps: '12–15', rest: '45s' },
    ],
  },
  full: {
    home: [
      { name: 'Burpees', sets: 4, reps: '10', rest: '60s' },
      { name: 'Push-ups', sets: 3, reps: '10–15', rest: '45s' },
      { name: 'Bodyweight squats', sets: 3, reps: '20', rest: '45s' },
      { name: 'Mountain climbers', sets: 3, reps: '40 total', rest: '45s' },
      { name: 'Plank', sets: 3, reps: '45s', rest: '30s' },
    ],
    gym: [
      { name: 'Goblet squat', sets: 4, reps: '8–12', rest: '75s' },
      { name: 'DB bench press', sets: 3, reps: '8–12', rest: '75s' },
      { name: 'Cable row', sets: 3, reps: '10–12', rest: '60s' },
      { name: 'Hanging knee raise', sets: 3, reps: '10–15', rest: '45s' },
      { name: 'Farmer carry', sets: 3, reps: '30m', rest: '60s' },
    ],
  },
  cardio: {
    home: [
      { name: 'Jump rope', sets: 5, reps: '60s on / 30s off', rest: '30s' },
      { name: 'High knees', sets: 4, reps: '40s on / 20s off', rest: '20s' },
      { name: 'Burpees', sets: 4, reps: '10', rest: '45s' },
      { name: 'Mountain climbers', sets: 4, reps: '40s on / 20s off', rest: '20s' },
    ],
    gym: [
      { name: 'Incline treadmill walk', sets: 1, reps: '20 min', rest: '—', note: 'Incline 8–10, brisk pace' },
      { name: 'Rowing intervals', sets: 6, reps: '250m', rest: '60s' },
      { name: 'Assault bike sprints', sets: 8, reps: '20s', rest: '40s' },
    ],
  },
  core: {
    home: [
      { name: 'Plank', sets: 3, reps: '45s', rest: '30s' },
      { name: 'Russian twists', sets: 3, reps: '20', rest: '30s' },
      { name: 'Leg raises', sets: 3, reps: '12–15', rest: '30s' },
      { name: 'Dead bug', sets: 3, reps: '10/side', rest: '30s' },
      { name: 'Hollow hold', sets: 3, reps: '30s', rest: '30s' },
    ],
    gym: [
      { name: 'Cable crunch', sets: 3, reps: '12–15', rest: '45s' },
      { name: 'Hanging leg raise', sets: 3, reps: '10–12', rest: '45s' },
      { name: 'Pallof press', sets: 3, reps: '10/side', rest: '30s' },
      { name: 'Weighted plank', sets: 3, reps: '45s', rest: '30s' },
    ],
  },
};

/* Weekly split selection based on days/week and goal */
function pickSplit(days: number, goal: Goal): string[] {
  if (days <= 2) return ['full', 'full'];
  if (days === 3) return goal === 'lose' ? ['full', 'cardio', 'full'] : ['push', 'pull', 'legs'];
  if (days === 4) return goal === 'lose' ? ['full', 'cardio', 'full', 'core'] : ['push', 'pull', 'legs', 'full'];
  if (days === 5) return ['push', 'pull', 'legs', 'cardio', 'core'];
  // 6 days
  return ['push', 'pull', 'legs', 'push', 'pull', 'cardio'];
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function buildWorkout(input: CoachInput): WorkoutDay[] {
  const days = clamp(input.daysPerWeek, 2, 6);
  const split = pickSplit(days, input.goal);

  return split.map((focus, idx) => {
    const bank = EX[focus][input.equipment];
    return {
      day: DAY_NAMES[idx] ?? `Day ${idx + 1}`,
      focus: focusLabel(focus),
      exercises: bank.slice(0, 5),
    };
  });
}

function focusLabel(key: string) {
  switch (key) {
    case 'push': return 'Push (chest, shoulders, triceps)';
    case 'pull': return 'Pull (back, biceps)';
    case 'legs': return 'Legs (quads, hamstrings, glutes)';
    case 'full': return 'Full body';
    case 'cardio': return 'Cardio + conditioning';
    case 'core': return 'Core + mobility';
    default: return key;
  }
}

/* ────────────────────────────────────────────────────────────────────
   MEAL PLAN BUILDER
   ──────────────────────────────────────────────────────────────────── */

function buildMeals(input: CoachInput, macros: Macros): Meal[] {
  const bank = MEAL_BANK[input.diet];
  // Pick a meal per slot — seed by simple hash of weight so it's stable
  const seed = Math.floor((input.weightKg + input.age) % 7);

  return SLOT_META.map((meta, i) => {
    const options = bank[i] ?? [];
    const choice = options.length ? options[(seed + i) % options.length] : { title: 'Balanced plate', items: [] };
    return {
      slot: meta.slot,
      time: meta.time,
      title: choice.title,
      items: choice.items,
      approxKcal: Math.round(macros.calories / SLOT_META.length),
    };
  });
}

/* ────────────────────────────────────────────────────────────────────
   INSIGHTS (coach-style commentary)
   ──────────────────────────────────────────────────────────────────── */

function buildInsights(input: CoachInput, macros: Macros, bmiVal: number): string[] {
  const band = bmiBand(bmiVal);
  const out: string[] = [];

  if (input.goal === 'lose') {
    out.push(
      `You're in a ~18% calorie deficit. Expect a healthy ${(0.4).toFixed(1)}–${(0.7).toFixed(1)} kg/week loss — anything faster usually means muscle loss.`,
    );
  } else if (input.goal === 'gain') {
    out.push(
      `You're in a ~12% surplus. Aim for ~${(0.25).toFixed(2)}–${(0.5).toFixed(2)} kg/week gain. More than that is mostly fat.`,
    );
  } else {
    out.push(`Calories are set to maintenance. Stay within ±5% of target and watch weight weekly.`);
  }

  out.push(
    `Protein target: ${macros.protein_g} g/day — split it across 4 meals (~${Math.round(macros.protein_g / 4)} g each) for best muscle synthesis.`,
  );

  out.push(
    `Drink ${macros.water_l} L water. Add 500 ml extra on training days. Indian summers? Bump by another 500 ml.`,
  );

  if (band === 'overweight' || band === 'obese') {
    out.push(`Your BMI is in the ${band} band. Pair this plan with 7–9 k steps daily — that alone moves the needle.`);
  }
  if (band === 'underweight') {
    out.push(`Your BMI is underweight — prioritise calorie surplus + heavy compound lifts. Eat even on "not hungry" days.`);
  }

  out.push(
    `Sleep 7+ hours. Without it, fat loss stalls and muscle recovery drops ~30%. This isn't optional.`,
  );

  return out;
}

function planBadge(input: CoachInput): string {
  const weeks = input.goal === 'lose' ? 12 : input.goal === 'gain' ? 16 : 8;
  const verb = input.goal === 'lose' ? 'lean cut' : input.goal === 'gain' ? 'muscle build' : 'recomp';
  return `${weeks}-week ${verb}`;
}

/* ────────────────────────────────────────────────────────────────────
   ORCHESTRATOR
   ──────────────────────────────────────────────────────────────────── */

export function generatePlan(input: CoachInput): CoachPlan {
  const safe: CoachInput = {
    ...input,
    age: clamp(input.age, 12, 90),
    heightCm: clamp(input.heightCm, 120, 230),
    weightKg: clamp(input.weightKg, 30, 250),
    daysPerWeek: clamp(input.daysPerWeek, 2, 6),
  };

  const bmi = calculateBMI(safe.weightKg, safe.heightCm);
  const bmr = calculateBMR(safe);
  const tdee = calculateTDEE(safe);
  const macros = calculateMacros(safe);

  return {
    bmi,
    bmiBand: bmiBand(bmi),
    bmr,
    tdee,
    macros,
    meals: buildMeals(safe, macros),
    workout: buildWorkout(safe),
    insights: buildInsights(safe, macros, bmi),
    badge: planBadge(safe),
  };
}

/* ────────────────────────────────────────────────────────────────────
   UTILITY
   ──────────────────────────────────────────────────────────────────── */

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function buildWhatsAppShare(plan: CoachPlan): string {
  const m = plan.macros;
  const text = [
    `My ActiveHQ AI Coach plan — ${plan.badge}`,
    `Calories ${m.calories} kcal | Protein ${m.protein_g}g | Carbs ${m.carbs_g}g | Fat ${m.fat_g}g | Water ${m.water_l}L`,
    `BMI ${plan.bmi} (${plan.bmiBand})  ·  BMR ${plan.bmr}  ·  TDEE ${plan.tdee}`,
    `Build your free plan: ${typeof window !== 'undefined' ? window.location.origin : 'activehq.fit'}/coach`,
  ].join('\n');
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
