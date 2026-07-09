-- Allow 'imported' as an SME source (dashboard / file bulk import).
-- The original constraint (migration 001) omitted it, so imports were
-- rejected by smes_source_check.

alter table smes drop constraint if exists smes_source_check;
alter table smes add constraint smes_source_check
  check (source in ('user', 'generated', 'cloned', 'promoted', 'imported'));
