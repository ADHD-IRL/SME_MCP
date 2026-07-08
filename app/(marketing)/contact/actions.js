'use server';

import { redirect } from 'next/navigation';
import { createLead } from '../../../src/lib/leads.js';

export async function submitLeadAction(formData) {
  const email = String(formData.get('email') || '').trim();
  try {
    await createLead({
      name: String(formData.get('name') || '').trim(),
      email,
      company: String(formData.get('company') || '').trim(),
      planInterest: String(formData.get('plan_interest') || '').trim(),
      message: String(formData.get('message') || '').trim(),
    });
  } catch (err) {
    redirect(`/contact?error=${encodeURIComponent(err.message)}`);
  }
  redirect('/contact?sent=1');
}
