'use client';

import { useState } from 'react';
import { ATTRIBUTE_GROUPS } from '../../../src/lib/sme-schema.js';

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

function DetailCard({ sme }) {
  const attrs = sme.attributes || {};
  return (
    <div style={{ background: 'var(--app-soft)', border: '1px solid var(--app-line)', borderRadius: 10, padding: '1rem 1.15rem', margin: '0 0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div>
          <strong style={{ fontSize: '1.05rem' }}>{sme.name}</strong>
          <span style={{ color: 'var(--app-accent-ink)', marginLeft: 8, fontWeight: 600 }}>
            {sme.discipline}{sme.expertise_level ? ` · ${sme.expertise_level}` : ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={pill}>{sme.status}</span>
          <span style={pill}>{sme.source}</span>
          {sme.quality_score != null && <span style={pill}>★ {sme.quality_score}</span>}
        </div>
      </div>

      {sme.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {sme.tags.map((t) => <span key={t} style={pill}>{t}</span>)}
        </div>
      )}
      {sme.domain_knowledge?.length > 0 && (
        <p style={{ fontSize: '0.85rem', color: 'var(--app-muted)', marginTop: 8 }}>
          <strong>Knows:</strong> {sme.domain_knowledge.join(' · ')}
        </p>
      )}

      <div style={{ marginTop: 12 }}>
        {CORE_ROWS.map(([k, label]) => (sme[k] ? (
          <Row key={k} label={label} value={sme[k]} />
        ) : null))}
      </div>

      {Object.keys(attrs).length > 0 && (
        <div style={{ marginTop: 10 }}>
          {ATTRIBUTE_GROUPS.map(({ group, fields }) => {
            const present = fields.filter(([key]) => attrs[key] != null && String(fmt(attrs[key])).trim());
            if (!present.length) return null;
            return (
              <div key={group} style={{ marginTop: 12 }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--app-faint)', marginBottom: 4 }}>{group}</div>
                {present.map(([key, label]) => <Row key={key} label={label} value={attrs[key]} />)}
              </div>
            );
          })}
          {attrs.vectors && <Row label="Vectors" value={attrs.vectors} />}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12, padding: '3px 0', fontSize: '0.88rem' }}>
      <div style={{ color: 'var(--app-muted)' }}>{label}</div>
      <div>{fmt(value)}</div>
    </div>
  );
}

function matches(s, q) {
  if (!q) return true;
  const hay = [s.name, s.discipline, s.expertise_level, s.role_type, ...(s.tags || [])]
    .filter(Boolean).join(' ').toLowerCase();
  return q.toLowerCase().split(/\s+/).every((term) => hay.includes(term));
}

export default function SmeList({ smes, admin, promoteAction }) {
  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [q, setQ] = useState('');

  const filtered = smes.filter((s) => matches(s, q));

  const toggleSel = (id) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // Select-all operates on the currently filtered set, and toggles based on
  // whether every filtered row is already selected. Selection persists across
  // filter changes, so you can build a cross-search multi-selection.
  const filteredIds = filtered.map((s) => s.id);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));
  const toggleAllFiltered = () => setSelected((prev) => {
    const next = new Set(prev);
    if (allFilteredSelected) filteredIds.forEach((id) => next.delete(id));
    else filteredIds.forEach((id) => next.add(id));
    return next;
  });
  const clearSelection = () => setSelected(new Set());

  if (smes.length === 0) {
    return <p style={{ color: 'var(--app-faint)' }}>None yet — create or import above.</p>;
  }

  const rows = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
      <tbody>
        {admin && filtered.length > 0 && (
          <tr style={{ borderBottom: '1px solid var(--app-line)', color: 'var(--app-muted)', fontSize: '0.8rem' }}>
            <td style={{ padding: '0.3rem 0.4rem', width: 28 }}>
              <input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered}
                aria-label="Select all shown" />
            </td>
            <td style={{ padding: '0.3rem 0.4rem' }} colSpan={4}>
              Select all {q ? `${filtered.length} shown` : ''} to promote
            </td>
          </tr>
        )}
        {filtered.map((s) => (
          <FragmentRow
            key={s.id}
            s={s}
            admin={admin}
            selected={selected.has(s.id)}
            onToggle={() => toggleSel(s.id)}
            open={expanded === s.id}
            onOpen={() => setExpanded(expanded === s.id ? null : s.id)}
          />
        ))}
        {filtered.length === 0 && (
          <tr><td colSpan={admin ? 5 : 4} style={{ padding: '0.8rem 0.4rem', color: 'var(--app-faint)' }}>No SMEs match “{q}”.</td></tr>
        )}
      </tbody>
    </table>
  );

  const filterBox = (
    <input
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder={`Filter ${smes.length} SMEs by name, discipline, or tag…`}
      style={{ width: '100%', padding: '0.5rem 0.7rem', border: '1px solid var(--app-line)', borderRadius: 8, marginBottom: 12, boxSizing: 'border-box' }}
    />
  );

  if (!admin) return <>{filterBox}{rows}</>;

  // Admin: wrap in a form so checked rows submit as sme_ids to the server action.
  return (
    <form action={promoteAction}>
      {filterBox}
      {selected.size > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                      background: 'var(--app-sel-bg)', border: '1px solid var(--app-sel-border)', borderRadius: 10,
                      padding: '0.6rem 0.9rem', marginBottom: 10 }}>
          <span style={{ fontSize: '0.9rem' }}>
            {selected.size} selected
            <button type="button" onClick={clearSelection} style={clearBtn}>clear</button>
          </span>
          <button type="submit" style={promoteBtn}>Promote {selected.size} to shared library →</button>
        </div>
      )}
      {/* Hidden inputs carry the full current selection (even rows hidden by the
          filter) into the form submit. */}
      {[...selected].map((id) => <input key={id} type="hidden" name="sme_ids" value={id} />)}
      {rows}
    </form>
  );
}

function FragmentRow({ s, admin, selected, onToggle, open, onOpen }) {
  return (
    <>
      <tr style={{ borderBottom: open ? 'none' : '1px solid var(--app-line)', cursor: 'pointer', background: selected ? 'var(--app-sel-bg)' : 'transparent' }}>
        {admin && (
          <td style={{ padding: '0.5rem 0.4rem', width: 28 }} onClick={(e) => e.stopPropagation()}>
            <input type="checkbox" checked={selected} onChange={onToggle} aria-label={`Select ${s.name}`} />
          </td>
        )}
        <td style={{ padding: '0.5rem 0.4rem' }} onClick={onOpen}>
          <strong>{s.name}</strong>
          <div style={{ color: 'var(--app-muted)', fontSize: '0.82rem' }}>{s.discipline}</div>
        </td>
        <td style={{ padding: '0.5rem 0.4rem', color: 'var(--app-muted)' }} onClick={onOpen}>{s.expertise_level || '—'}</td>
        <td style={{ padding: '0.5rem 0.4rem', color: 'var(--app-muted)' }} onClick={onOpen}>{s.status}</td>
        <td style={{ padding: '0.5rem 0.4rem', color: 'var(--app-muted)', textAlign: 'right' }} onClick={onOpen}>
          {open ? '▲' : '▼'}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={admin ? 5 : 4} style={{ padding: '0 0.4rem 0.8rem' }}>
            <DetailCard sme={s} />
          </td>
        </tr>
      )}
    </>
  );
}

const pill = { border: '1px solid var(--app-line)', borderRadius: 999, padding: '2px 9px', fontSize: '0.75rem', color: 'var(--app-muted)', background: 'var(--app-card)', whiteSpace: 'nowrap' };
const promoteBtn = { padding: '0.45rem 1rem', border: 'none', borderRadius: 6, background: 'var(--app-accent)', color: 'var(--app-card)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 };
const clearBtn = { marginLeft: 8, background: 'none', border: 'none', color: 'var(--app-accent)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.82rem' };
