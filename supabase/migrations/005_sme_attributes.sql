-- Rich SME attribute set (intelligence-analysis / red-team profile format).
-- The searchable core columns on `smes` stay authoritative for search and
-- ranking; the full structured profile lives here so nothing is lost.

alter table smes add column if not exists attributes jsonb not null default '{}';
alter table smes add column if not exists role_type text;

-- Fold the key long-form attribute text into the search vector so the rich
-- fields are discoverable, not just the core columns.
alter table smes drop column if exists search_vector;
alter table smes add column search_vector tsvector generated always as (
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(discipline, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(persona_description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(professional_background, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(reasoning_style, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(attributes::text, '')), 'D')
) stored;

create index if not exists smes_search_idx on smes using gin (search_vector);
