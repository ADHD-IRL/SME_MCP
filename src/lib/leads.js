import { getSupabase } from './supabase.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createLead({ name, email, company, planInterest, message, source = 'contact_form' }) {
  if (!email || !EMAIL_RE.test(email)) throw new Error('A valid email is required');

  const { error } = await getSupabase().from('leads').insert({
    name: name || null,
    email,
    company: company || null,
    plan_interest: planInterest || null,
    message: message || null,
    source,
  });
  if (error) throw new Error(error.message);
}
