/** Public marketing pricing — keep in sync across home, owners, and landing pages. */

export const PRICING = {
  normal: {
    label: 'Standard',
    yearlyInr: 15_000,
    setupInr: 5_000,
    yearlyNote: '/year',
    setupNote: 'one-time setup',
  },
  founding: {
    label: 'Founding gym',
    yearlyInr: 10_000,
    setupInr: 5_000,
    yearlyNote: 'first year',
    setupNote: 'one-time setup',
    badge: 'Founding offer',
    limitedNote: 'Limited founding spots',
  },
} as const

export function formatInr(amount: number): string {
  return amount.toLocaleString('en-IN')
}
