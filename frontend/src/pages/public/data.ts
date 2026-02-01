export const locations = {
  city: 'Gurgaon',
  localities: ['Sector 29', 'DLF Phase 3', 'Sohna Road', 'Golf Course Road'],
  centerTypes: ['Gym', 'Fitness Studio', 'CrossFit', 'Strength Training'],
};

export const gyms = [
  {
    id: 'fitzone-sector-29',
    name: 'FitZone Gym',
    logoText: 'FZ',
    logoColor: 'bg-emerald-600',
    centerType: 'Gym',
    locality: 'Sector 29',
    address: 'SCO 18, Sector 29, Gurgaon, Haryana 122001',
    monthlyCost: 1200,
    rating: 4.4,
    tags: ['Strength', 'Cardio', 'Locker'],
    packages: [
      { title: 'Monthly', price: 1200, duration: '1 month' },
      { title: 'Quarterly', price: 3200, duration: '3 months' },
      { title: 'Yearly', price: 11000, duration: '12 months' },
    ],
  },
  {
    id: 'iron-hub-dlf-3',
    name: 'Iron Hub Fitness',
    logoText: 'IH',
    logoColor: 'bg-blue-600',
    centerType: 'CrossFit',
    locality: 'DLF Phase 3',
    address: 'Plot 42, DLF Phase 3, Gurgaon, Haryana 122010',
    monthlyCost: 1500,
    rating: 4.6,
    tags: ['CrossFit', 'HIIT', 'PT'],
    packages: [
      { title: 'Monthly', price: 1500, duration: '1 month' },
      { title: 'Half Yearly', price: 8000, duration: '6 months' },
      { title: 'Yearly', price: 14000, duration: '12 months' },
    ],
  },
  {
    id: 'pulse-sohna-road',
    name: 'Pulse Gym & Wellness',
    logoText: 'PW',
    logoColor: 'bg-purple-600',
    centerType: 'Fitness Studio',
    locality: 'Sohna Road',
    address: 'Tower B, Sohna Road, Gurgaon, Haryana 122018',
    monthlyCost: 1000,
    rating: 4.2,
    tags: ['Cardio', 'Zumba', 'Steam'],
    packages: [
      { title: 'Monthly', price: 1000, duration: '1 month' },
      { title: 'Quarterly', price: 2700, duration: '3 months' },
      { title: 'Yearly', price: 9000, duration: '12 months' },
    ],
  },
  {
    id: 'peak-gcr',
    name: 'Peak Performance Gym',
    logoText: 'PP',
    logoColor: 'bg-amber-600',
    centerType: 'Strength Training',
    locality: 'Golf Course Road',
    address: 'GCR Plaza, Golf Course Road, Gurgaon, Haryana 122009',
    monthlyCost: 1800,
    rating: 4.7,
    tags: ['Premium', 'PT', 'Nutrition'],
    packages: [
      { title: 'Monthly', price: 1800, duration: '1 month' },
      { title: 'Quarterly', price: 5000, duration: '3 months' },
      { title: 'Yearly', price: 16000, duration: '12 months' },
    ],
  },
];

export const articles = [
  {
    id: 'attendance-discipline',
    title: 'Why daily attendance tracking increases renewals',
    excerpt:
      'When members see consistency, they renew more. Simple daily tracking builds habits and retention.',
    date: '12 Jan, 2026',
    category: 'Operations',
  },
  {
    id: 'cash-upi-ops',
    title: 'Cash + UPI workflow that saves 2 hours daily',
    excerpt:
      'Simple payment logging helps staff close the day without chaos and avoids missed collections.',
    date: '18 Jan, 2026',
    category: 'Payments',
  },
  {
    id: 'renewal-playbook',
    title: '7-day renewal reminders that actually work',
    excerpt:
      'A short, polite WhatsApp flow can improve renewals by 20–30%.',
    date: '22 Jan, 2026',
    category: 'Retention',
  },
  {
    id: 'local-gym-growth',
    title: 'How neighborhood gyms win with simple systems',
    excerpt:
      'No fancy tech needed — just clean data, quick follow-ups, and staff discipline.',
    date: '26 Jan, 2026',
    category: 'Growth',
  },
];

export const benefits = [
  'Made by gym owners and techies for gym owners',
  'Works on slow networks and budget devices',
  'Cash + UPI friendly with simple daily closing',
  'WhatsApp renewal reminders included',
  'No complicated setup or training required',
];

export const membershipPlans = [
  {
    title: 'Monthly Plan',
    price: 1200,
    features: ['Basic access', 'Cardio + strength', 'Trainer support'],
  },
  {
    title: 'Quarterly Plan',
    price: 3200,
    features: ['Full access', 'Group classes', 'Priority slots'],
  },
  {
    title: 'Yearly Plan',
    price: 11000,
    features: ['Best value', 'PT discounts', 'Nutrition guidance'],
  },
];
