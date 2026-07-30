'use client';

import { useMemo, useState } from 'react';
import { ATTRIBUTE_GROUPS } from '../../../../src/lib/sme-schema.js';

function fmt(v) {
  if (Array.isArray(v)) return v.join(', ');
  if (v && typeof v === 'object') return Object.entries(v).map(([k, n]) => `${k}: ${n}`).join(' · ');
  return String(v);
}

const CORE_ROWS = [
  ['persona_description', 'Persona'],
  ['professional_background', 'Background'],
  ['reasoning_style', 'Reasoning style'],
  ['strengths', 'Strengths'],
  ['limitations', 'Limitations'],
  ['cognitive_biases', 'Cognitive biases'],
  ['communication_style', 'Communication style'],
];

const EDIT_FIELDS = [
  ['name', 'Name', false],
  ['discipline', 'Discipline', false],
  ['expertise_level', 'Expertise level', false],
  ['persona_description', 'Persona', true],
  ['professional_background', 'Background', true],
  ['reasoning_style', 'Reasoning style', true],
  ['strengths', 'Strengths', true],
  ['limitations', 'Limitations', true],
  ['cognitive_biases', 'Cognitive biases', true],
  ['communication_style', 'Communication style', false],
];

const S = {
  chip: (active) => ({
    padding: '0.3rem 0.8rem', borderRadius: 999, cursor: 'pointer', fontSize: '0.83rem',
    border: '1px solid var(--app-line)', textDecoration: 'none',
    background: active ? 'var(--app-ink)' : 'var(--app-card)',
    color: active ? 'var(--app-card)' : 'var(--app-ink)',
  }),
  input: { padding: '0.5rem 0.7rem', border: '1px solid var(--app-line)', borderRadius: 8, background: 'var(--app-card)', color: 'var(--app-ink)', boxSizing: 'border-box' },
  btn: { padding: '0.4rem 0.85rem', border: '1px solid var(--app-line)', borderRadius: 6, background: 'var(--app-card)', color: 'var(--app-ink)', cursor: 'pointer', fontSize: '0.83rem' },
  btnDanger: { padding: '0.4rem 0.85rem', border: '1px solid var(--app-danger)', borderRadius: 6, background: 'var(--app-card)', color: 'var(--app-danger)', cursor: 'pointer', fontSize: '0.83rem' },
  btnPrimary: { padding: '0.45rem 1rem', border: 'none', borderRadius: 6, background: 'var(--app-accent)', color: 'var(--app-card)', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600 },
  pill: { border: '1px solid var(--app-line)', borderRadius: 999, padding: '2px 9px', fontSize: '0.72rem', color: 'var(--app-muted)', background: 'var(--app-card)', whiteSpace: 'nowrap' },
};

function statusPill(status) {
  const map = {
    active: ['var(--app-ok-bg)', 'var(--app-ok)'],
    deprecated: ['var(--app-warn-bg)', 'var(--app-warn)'],
    archived: ['var(--app-line)', 'var(--app-muted)'],
  };
  const [bg, fg] = map[status] || ['var(--app-line)', 'var(--app-muted)'];
  return { marginLeft: 8, fontSize: '0.7rem', fontWeight: 600, padding: '1px 8px', borderRadius: 10, background: bg, color: fg };
}

function Detail({ sme }) {
  const attrs = sme.attributes || {};
  return (
    <div style={{ background: 'var(--app-soft)', border: '1px solid var(--app-line)', borderRadius: 10, padding: '1rem 1.15rem' }}>
      {sme.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {sme.tags.map((t) => <span key={t} style={S.pill}>{t}</span>)}
        </div>
      )}
      {sme.domain_knowledge?.length > 0 && (
        <p style={{ fontSize: '0.85rem', color: 'var(--app-muted)', marginTop: 0 }}><strong>Knows:</strong> {sme.domain_knowledge.join(' · ')}</p>
      )}
      {CORE_ROWS.map(([k, label]) => (sme[k] ? <Row key={k} label={label} value={sme[k]} /> : null))}
      {ATTRIBUTE_GROUPS.map(({ group, fields }) => {
        const present = fields.filter(([key]) => attrs[key] != null && String(fmt(attrs[key])).trim());
        if (!present.length) return null;
        return (
          <div key={group} style={{ marginTop: 12 }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--app-faint)', marginBottom: 4 }}>{group}</div>
            {present.map(([key, label]) => <Row key={key} label={label} value={attrs[key]} />)}
          </div>
        );
      })}
      {attrs.vectors && <Row label="Vectors" value={attrs.vectors} />}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 12, padding: '3px 0', fontSize: '0.86rem' }}>
      <div style={{ color: 'var(--app-muted)' }}>{label}</div>
      <div>{fmt(value)}</div>
    </div>
  );
}

function EditForm({ sme, updateAction }) {
  return (
    <form action={updateAction} style={{ display: 'grid', gap: '0.7rem', background: 'var(--app-soft)', border: '1px solid var(--app-line)', borderRadius: 10, padding: '1rem 1.15rem' }}>
      <input type="hidden" name="id" value={sme.id} />
      {EDIT_FIELDS.map(([field, label, multiline]) => (
        <label key={field} style={{ fontSize: '0.82rem', color: 'var(--app-muted)', display: 'grid', gap: 4 }}>
          {label}
          {multiline
            ? <textarea name={field} defaultValue={sme[field] ?? ''} rows={2} style={{ ...S.input, resize: 'vertical', fontFamily: 'inherit' }} />
            : <input name={field} defaultValue={sme[field] ?? ''} style={S.input} />}
        </label>
      ))}
      <label style={{ fontSize: '0.82rem', color: 'var(--app-muted)', display: 'grid', gap: 4 }}>
        Domain knowledge (comma-separated)
        <input name="domain_knowledge" defaultValue={(sme.domain_knowledge ?? []).join(', ')} style={S.input} />
      </label>
      <label style={{ fontSize: '0.82rem', color: 'var(--app-muted)', display: 'grid', gap: 4 }}>
        Tags (comma-separated)
        <input name="tags" defaultValue={(sme.tags ?? []).join(', ')} style={S.input} />
      </label>
      <label style={{ fontSize: '0.82rem', color: 'var(--app-muted)', display: 'grid', gap: 4 }}>
        Change summary (optional)
        <input name="change_summary" placeholder="What changed and why" style={S.input} />
      </label>
      <div><button style={S.btnPrimary}>Save new version</button></div>
    </form>
  );
}

export default function LibraryConsole({ smes, pending, actions }) {
  const { setStatusAction, deleteLibraryAction, bulkStatusAction, bulkDeleteAction, updateLibraryAction, decidePromotionAction } = actions;

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [discipline, setDiscipline] = useState('');
  const [sort, setSort] = useState('quality');
  const [selected, setSelected] = useState(() => new Set());
  const [open, setOpen] = useState(null);   // expanded detail id
  const [editing, setEditing] = useState(null); // inline edit id

  const disciplines = useMemo(
    () => [...new Set(smes.map((s) => s.discipline).filter(Boolean))].sort(),
    [smes]
  );

  const filtered = useMemo(() => {
    let list = smes.filter((s) => {
      if (status !== 'all' && s.status !== status) return false;
      if (discipline && s.discipline !== discipline) return false;
      if (q) {
        const hay = [s.name, s.discipline, s.expertise_level, ...(s.tags || [])].filter(Boolean).join(' ').toLowerCase();
        if (!q.toLowerCase().split(/\s+/).every((t) => hay.includes(t))) return false;
      }
      return true;
    });
    const cmp = {
      quality: (a, b) => (b.quality_score ?? -1) - (a.quality_score ?? -1),
      usage: (a, b) => (b.usage_count ?? 0) - (a.usage_count ?? 0),
      name: (a, b) => (a.name || '').localeCompare(b.name || ''),
      newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
    }[sort];
    return [...list].sort(cmp);
  }, [smes, status, discipline, q, sort]);

  const toggle = (id) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const filteredIds = filtered.map((s) => s.id);
  const allSel = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));
  const toggleAll = () => setSelected((p) => { const n = new Set(p); allSel ? filteredIds.forEach((id) => n.delete(id)) : filteredIds.forEach((id) => n.add(id)); return n; });
  const selectedIds = [...selected];

  const counts = useMemo(() => {
    const c = { all: smes.length, active: 0, deprecated: 0, archived: 0 };
    smes.forEach((s) => { c[s.status] = (c[s.status] || 0) + 1; });
    return c;
  }, [smes]);

  return (
    <div>
      {/* Pending promotions */}
      {pending.length > 0 && (
        <section style={{ border: '1px solid var(--app-warn-border)', background: 'var(--app-warn-bg)', borderRadius: 12, padding: '1rem 1.2rem', marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>⚑ {pending.length} pending {pending.length === 1 ? 'suggestion' : 'suggestions'} to moderate</h2>
          {pending.map((p) => {
            const sme = p.smes || {};
            return (
              <div key={p.id} style={{ borderTop: '1px solid var(--app-warn-border)', paddingTop: 10, marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
                  <div>
                    <strong>{sme.name}</strong> <span style={{ color: 'var(--app-muted)' }}>· {sme.discipline}</span>
                    <div style={{ fontSize: '0.82rem', color: 'var(--app-muted)' }}>quality {sme.quality_score ?? '—'} · {sme.usage_count ?? 0} uses</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <form action={decidePromotionAction}>
                      <input type="hidden" name="promotion_id" value={p.id} />
                      <input type="hidden" name="decision" value="approved" />
                      <button style={{ ...S.btnPrimary, background: 'var(--app-ok)' }}>Approve</button>
                    </form>
                    <form action={decidePromotionAction}>
                      <input type="hidden" name="promotion_id" value={p.id} />
                      <input type="hidden" name="decision" value="rejected" />
                      <button style={S.btnDanger}>Reject</button>
                    </form>
                  </div>
                </div>
                {sme.persona_description && <p style={{ fontSize: '0.86rem', color: 'var(--app-ink)', margin: '6px 0 0' }}>{sme.persona_description}</p>}
              </div>
            );
          })}
        </section>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, discipline, tag…" style={{ ...S.input, flex: 1, minWidth: 200 }} />
        <select value={discipline} onChange={(e) => setDiscipline(e.target.value)} style={S.input}>
          <option value="">All disciplines</option>
          {disciplines.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={S.input}>
          <option value="quality">Sort: Quality</option>
          <option value="usage">Sort: Usage</option>
          <option value="name">Sort: Name</option>
          <option value="newest">Sort: Newest</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {['all', 'active', 'deprecated', 'archived'].map((t) => (
          <button key={t} onClick={() => setStatus(t)} style={S.chip(t === status)}>
            {t} <span style={{ opacity: 0.6 }}>{counts[t] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Bulk bar */}
      {selectedIds.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', background: 'var(--app-sel-bg)', border: '1px solid var(--app-sel-border)', borderRadius: 10, padding: '0.6rem 0.9rem', marginBottom: 12 }}>
          <span style={{ fontSize: '0.88rem' }}>{selectedIds.length} selected</span>
          <button onClick={() => setSelected(new Set())} style={{ ...S.btn, borderColor: 'transparent', textDecoration: 'underline' }}>clear</button>
          <span style={{ flex: 1 }} />
          {[['active', 'Activate'], ['deprecated', 'Deprecate'], ['archived', 'Archive']].map(([st, label]) => (
            <form key={st} action={bulkStatusAction}>
              {selectedIds.map((id) => <input key={id} type="hidden" name="ids" value={id} />)}
              <input type="hidden" name="status" value={st} />
              <button style={S.btn}>{label}</button>
            </form>
          ))}
          <form action={bulkDeleteAction}>
            {selectedIds.map((id) => <input key={id} type="hidden" name="ids" value={id} />)}
            <button style={S.btnDanger}>Delete</button>
          </form>
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 4px', color: 'var(--app-faint)', fontSize: '0.8rem', borderBottom: '1px solid var(--app-line)' }}>
        <input type="checkbox" checked={allSel} onChange={toggleAll} aria-label="Select all shown" />
        <span>{filtered.length} shown</span>
      </div>

      {/* Rows */}
      {filtered.length === 0 && <p style={{ color: 'var(--app-faint)', marginTop: 16 }}>No SMEs match the current filters.</p>}
      {filtered.map((s) => (
        <div key={s.id} style={{ borderBottom: '1px solid var(--app-line)', padding: '0.6rem 0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} aria-label={`Select ${s.name}`} />
            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => { setOpen(open === s.id ? null : s.id); setEditing(null); }}>
              <strong>{s.name}</strong>
              <span style={{ color: 'var(--app-muted)' }}> · {s.discipline}{s.expertise_level ? ` · ${s.expertise_level}` : ''}</span>
              <span style={statusPill(s.status)}>{s.status}</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--app-muted)', whiteSpace: 'nowrap' }}>★ {s.quality_score ?? '—'} · {s.usage_count ?? 0}</span>
            <button onClick={() => { setEditing(editing === s.id ? null : s.id); setOpen(null); }} style={S.btn}>{editing === s.id ? 'Close' : 'Edit'}</button>
            <StatusMenu sme={s} setStatusAction={setStatusAction} />
            <form action={deleteLibraryAction} onSubmit={(e) => { if (!confirm(`Permanently delete “${s.name}”?`)) e.preventDefault(); }}>
              <input type="hidden" name="id" value={s.id} />
              <button style={S.btnDanger}>Delete</button>
            </form>
          </div>
          {open === s.id && <div style={{ marginTop: 10 }}><Detail sme={s} /></div>}
          {editing === s.id && <div style={{ marginTop: 10 }}><EditForm sme={s} updateAction={updateLibraryAction} /></div>}
        </div>
      ))}
    </div>
  );
}

function StatusMenu({ sme, setStatusAction }) {
  const next = { active: 'deprecated', deprecated: 'archived', archived: 'active' }[sme.status] || 'active';
  const label = { active: 'Deprecate', deprecated: 'Archive', archived: 'Reactivate' }[sme.status] || 'Activate';
  return (
    <form action={setStatusAction}>
      <input type="hidden" name="id" value={sme.id} />
      <input type="hidden" name="status" value={next} />
      <button style={S.btn}>{label}</button>
    </form>
  );
}
