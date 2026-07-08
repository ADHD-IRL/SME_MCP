-- Phase 3/4: semantic search RPC + scheduled maintenance.

-- Vector similarity search, scoped exactly like the keyword path
-- (library | workspace | all-visible-to-workspace).
create or replace function match_smes(
  p_embedding vector(384),
  p_workspace_id uuid,
  p_scope text default 'all',
  p_limit int default 10
)
returns table (id uuid, similarity float)
language sql
stable
security definer
as $$
  select s.id, 1 - (s.embedding <=> p_embedding) as similarity
  from smes s
  where s.embedding is not null
    and s.status <> 'archived'
    and case p_scope
          when 'library' then s.visibility = 'library'
          when 'workspace' then s.workspace_id = p_workspace_id
          else (s.workspace_id = p_workspace_id or s.visibility = 'library')
        end
  order by s.embedding <=> p_embedding
  limit least(p_limit, 50);
$$;

-- Daily maintenance, called by the Vercel cron route:
--  1. drop expired rate-limit windows
--  2. recompute smoothed quality for SMEs with feedback in the last 25h
--     (25h so a daily cron never leaves a gap)
create or replace function run_maintenance()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_rl int;
  v_q int;
begin
  delete from rate_limits where window_start < now() - interval '2 days';
  get diagnostics v_rl = row_count;

  with recent as (
    select distinct sme_id from sme_feedback
    where created_at > now() - interval '25 hours'
  ), agg as (
    select sf.sme_id, count(*)::int as n, coalesce(sum(sf.score), 0) as total
    from sme_feedback sf
    join recent r on r.sme_id = sf.sme_id
    group by sf.sme_id
  ), upd as (
    update smes s
    set usage_count = agg.n,
        quality_score = round(((20 * 70) + agg.total) / (20 + agg.n)::numeric, 1),
        updated_at = now()
    from agg
    where s.id = agg.sme_id
    returning s.id
  )
  select count(*) into v_q from upd;

  return jsonb_build_object(
    'rate_limit_rows_deleted', v_rl,
    'quality_recomputed', v_q
  );
end;
$$;
