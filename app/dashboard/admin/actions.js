'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, isAdminEmail } from '../../../src/lib/supabase-ssr.js';
import { decidePromotion } from '../../../src/lib/promotions.js';

export async function decidePromotionAction(formData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isAdminEmail(user.email)) throw new Error('Admin access required');

  await decidePromotion({
    promotionId: String(formData.get('promotion_id')),
    decision: String(formData.get('decision')),
    notes: String(formData.get('notes') || '') || undefined,
    reviewerId: null, // reviewer is an auth user, not an api key; audited via notes
  });

  revalidatePath('/dashboard/admin');
  redirect('/dashboard/admin');
}
