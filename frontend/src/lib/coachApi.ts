import axios from 'axios';
import type { CoachInput, CoachPlan } from '@/lib/coach';

export type CoachLocale = 'en' | 'hi';

function coachApiBase(): string {
  const env = import.meta.env.VITE_API_URL?.trim();
  if (env) return env.replace(/\/+$/, '');
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.endsWith('.vercel.app') || host === 'activehq.fit' || host === 'www.activehq.fit') {
      return 'https://activehq-api.onrender.com';
    }
  }
  return '';
}

/**
 * POST /api/coach/plan — server builds the same deterministic plan as the
 * browser, then optionally rewrites `insights` with Gemini Flash.
 */
export async function fetchCoachPlan(input: CoachInput, locale: CoachLocale): Promise<CoachPlan> {
  const base = coachApiBase();
  const url = base ? `${base}/api/coach/plan` : '/api/coach/plan';
  const { data } = await axios.post<CoachPlan>(
    url,
    { ...input, locale },
    { timeout: 45000, headers: { 'Content-Type': 'application/json' } },
  );
  return data;
}
