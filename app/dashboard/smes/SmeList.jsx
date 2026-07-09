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
    <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 10, padding: '1rem 1.15rem', margin: '0 0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div>
          <strong style={{ fontSize: '1.05rem' }}>{sme.name}</strong>
          <span style={{ color: '#4338ca', marginLeft: 8, fontWeight: 600 }}>
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
        <p style={{ fontSize: '0.85rem', color: '#555', marginTop: 8 }}>
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
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: 4 }}>{group}</div>
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
      <div style={{ color: '#777' }}>{label}</div>
      <div>{fmt(value)}</div>
    </div>
  );
}

export default function SmeList({ smes, admin, promoteAction }) {
  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState(() => new Set());

  const toggleSel = (id) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const allSelected = smes.length > 0 && selected.size === smes.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(smes.map((s) => s.id)));

  if (smes.length === 0) {
    return <p style={{ color: '#888' }}>None yet — create or import above.</p>;
  }

  const rows = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
      <tbody>
        {admin && (
          <tr style={{ borderBottom: '1px solid #eee', color: '#777', fontSize: '0.8rem' }}>
            <td style={{ padding: '0.3rem 0.4rem', width: 28 }}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
            </td>
            <td style={{ padding: '0.3rem 0.4rem' }} colSpan={4}>Select to promote</td>
          </tr>
        )}
        {smes.map((s) => (
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
      </tbody>
    </table>
  );

  if (!admin) return rows;

  // Admin: wrap in a form so checked rows submit as sme_ids to the server action.
  return (
    <form action={promoteAction}>
      {selected.size > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10,
                      padding: '0.6rem 0.9rem', marginBottom: 10 }}>
          <span style={{ fontSize: '0.9rem' }}>{selected.size} selected</span>
          <button type="submit" style={promoteBtn}>Promote {selected.size} to shared library →</button>
        </div>
      )}
      {/* Hidden inputs carry the current selection into the form submit. */}
      {[...selected].map((id) => <input key={id} type="hidden" name="sme_ids" value={id} />)}
      {rows}
    </form>
  );
}

function FragmentRow({ s, admin, selected, onToggle, open, onOpen }) {
  return (
    <>
      <tr style={{ borderBottom: open ? 'none' : '1px solid #f2f2f2', cursor: 'pointer', background: selected ? '#f5f7ff' : 'transparent' }}>
        {admin && (
          <td style={{ padding: '0.5rem 0.4rem', width: 28 }} onClick={(e) => e.stopPropagation()}>
            <input type="checkbox" checked={selected} onChange={onToggle} aria-label={`Select ${s.name}`} />
          </td>
        )}
        <td style={{ padding: '0.5rem 0.4rem' }} onClick={onOpen}>
          <strong>{s.name}</strong>
          <div style={{ color: '#777', fontSize: '0.82rem' }}>{s.discipline}</div>
        </td>
        <td style={{ padding: '0.5rem 0.4rem', color: '#666' }} onClick={onOpen}>{s.expertise_level || '—'}</td>
        <td style={{ padding: '0.5rem 0.4rem', color: '#666' }} onClick={onOpen}>{s.status}</td>
        <td style={{ padding: '0.5rem 0.4rem', color: '#666', textAlign: 'right' }} onClick={onOpen}>
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

const pill = { border: '1px solid #ddd', borderRadius: 999, padding: '2px 9px', fontSize: '0.75rem', color: '#555', background: '#fff', whiteSpace: 'nowrap' };
const promoteBtn = { padding: '0.45rem 1rem', border: 'none', borderRadius: 6, background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 };
