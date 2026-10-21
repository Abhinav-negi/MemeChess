import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// null when not configured: friend mode shows a setup message instead of crashing.
export const supabase = url && key ? createClient(url, key) : null;

/** Signs in anonymously once per browser; the session persists in localStorage. */
export async function ensureUser() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user;
  const { data: signedIn, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return signedIn.user;
}

export function newGameId() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}
