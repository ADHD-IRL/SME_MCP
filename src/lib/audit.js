import { getSupabase } from './supabase.js';

// Fire-and-forget audit trail; never blocks or fails the calling tool.
export function audit(ctx, action, entityType, entityId, detail) {
  try {
    getSupabase()
      .from('audit_log')
      .insert({
        api_key_id: ctx.keyId,
        workspace_id: ctx.workspaceId,
        action,
        entity_type: entityType,
        entity_id: entityId ?? null,
        detail: detail ?? null,
      })
      .then(() => {}, () => {});
  } catch {
    // supabase not configured (e.g. during build) — ignore
  }
}
