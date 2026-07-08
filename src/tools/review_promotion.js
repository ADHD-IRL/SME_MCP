import { z } from 'zod';
import { listPendingPromotions, decidePromotion } from '../lib/promotions.js';

export default {
  name: 'review_promotion',
  description:
    'Admin: approve or reject a pending library promotion. Approval copies the SME into the shared library as an immutable entry with lineage to the source. Omit promotion_id to list the pending queue.',
  scope: 'admin',
  audit: 'promotion.review',
  schema: {
    promotion_id: z.string().uuid().optional().describe('Pending promotion to decide; omit to list the queue'),
    decision: z.enum(['approved', 'rejected']).optional(),
    notes: z.string().optional(),
  },
  async handler({ promotion_id, decision, notes }, ctx) {
    if (!promotion_id) {
      return { pending: await listPendingPromotions() };
    }
    if (!decision) throw new Error('decision is required when promotion_id is given');
    return decidePromotion({ promotionId: promotion_id, decision, notes, reviewerId: ctx.keyId });
  },
};
