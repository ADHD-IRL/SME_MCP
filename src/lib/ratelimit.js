import { getSupabase } from './supabase.js';

// Fixed-window limits per tier. `requests` guards every tool call;
// `generations` additionally guards the Anthropic-backed generate tool.
const TIERS = {
  free: {
    requests: { windowSeconds: 60, max: 60 },
    generations: { windowSeconds: 86400, max: 20 },
  },
  pro: {
    requests: { windowSeconds: 60, max: 300 },
    generations: { windowSeconds: 86400, max: 200 },
  },
  unlimited: null,
};

export async function checkRateLimit(ctx, bucket = 'requests') {
  const tier = TIERS[ctx.tier] ?? TIERS.free;
  if (!tier) return; // unlimited
  const limit = tier[bucket];
  if (!limit) return;

  const supabase = getSupabase();
  const { data: count, error } = await supabase.rpc('increment_rate_limit', {
    p_key_id: ctx.keyId,
    p_bucket: bucket,
    p_window_seconds: limit.windowSeconds,
  });

  // Fail open on infrastructure errors, closed on a genuine limit.
  if (error) return;
  if (count > limit.max) {
    const window = limit.windowSeconds >= 86400 ? 'day' : `${limit.windowSeconds}s`;
    throw new Error(`Rate limit exceeded: ${limit.max} ${bucket} per ${window} on the '${ctx.tier}' tier`);
  }
}
