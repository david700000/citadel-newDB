import React, { useState, useEffect } from 'react';
import TemplateEditor from './TemplateEditor';
import API_URLS from './api';

const S = {
  page:    { padding: '28px 5%', maxWidth: 960, margin: '0 auto', fontFamily: "'DM Sans', sans-serif" },
  header:  { display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  h1:      { fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 },
  sub:     { fontSize: 13, color: '#64748b', marginTop: 3 },
  addBtn:  { padding: '10px 20px', background: '#0B1F3B', color: 'white', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  card:    { background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  thumb:   { height: 180, background: '#f1f5f9', backgroundSize: 'cover', backgroundPosition: 'center' },
  cardBody:{ padding: '14px 16px' },
  cardName:{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' },
  cardDesc:{ fontSize: 13, color: '#64748b', margin: '0 0 12px 0' },
  cardRow: { display: 'flex', gap: 8 },
  editBtn: { flex: 1, padding: '8px 0', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#0f172a' },
  delBtn:  { padding: '8px 14px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#e11d48' },
  empty:   { gridColumn: '1 / -1', textAlign: 'center', padding: '52px 0', color: '#94a3b8', fontSize: 14 },
  activeDot: (active) => ({ width: 8, height: 8, borderRadius: '50%', background: active ? '#22c55e' : '#e2e8f0', display: 'inline-block', marginRight: 6 }),
};

export default function CMSTemplates({ state, toast }) {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing]     = useState(null);
  const [loading, setLoading]     = useState(true);

  const fetch_ = async (url, opts) => fetch(url, { ...opts, headers: { 'Authorization': `Bearer ${state.session.token}`, ...(opts?.headers || {}) } });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch_(API_URLS.TEMPLATES_ADMIN);
      if (res.ok) setTemplates(await res.json());
    } catch { toast('Failed to load templates', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async (data) => {
    const url = editing?._id ? `${API_URLS.TEMPLATES_ADMIN}/${editing._id}` : API_URLS.TEMPLATES_ADMIN;
    try {
      const res = await fetch_(url, {
        method: editing?._id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) { toast('Template saved', 'success'); setEditing(null); load(); }
      else toast('Save failed', 'error');
    } catch { toast('Save failed', 'error'); }
  };

  const upload = async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch_(API_URLS.UPLOAD, { method: 'POST', body: fd });
      const d = await res.json();
      if (res.ok) return d.url;
      toast(d.error || 'Upload failed', 'error');
    } catch { toast('Upload failed', 'error'); }
    return null;
  };

  const del = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      const res = await fetch_(`${API_URLS.TEMPLATES_ADMIN}/${id}`, { method: 'DELETE' });
      if (res.ok) { toast('Deleted', 'success'); load(); }
      else toast('Delete failed', 'error');
    } catch { toast('Delete failed', 'error'); }
  };

  if (editing !== null) {
    return <TemplateEditor templateData={editing === 'new' ? null : editing} onSave={save} onCancel={() => setEditing(null)} uploadFile={upload} />;
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>DP Templates</h1>
          <p style={S.sub}>Configure the graphic frame and text fields users will see on the /graphics page.</p>
        </div>
        <button style={S.addBtn} onClick={() => setEditing('new')}>+ New Template</button>
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading…</p>
      ) : (
        <div style={S.grid}>
          {templates.map(t => (
            <div key={t._id} style={S.card}>
              <div style={{ ...S.thumb, backgroundImage: t.backgroundUrl ? `url(${t.backgroundUrl})` : 'none' }} />
              <div style={S.cardBody}>
                <p style={S.cardName}>
                  <span style={S.activeDot(t.isActive)} />
                  {t.name}
                </p>
                <p style={S.cardDesc}>{t.description || 'No description'}</p>
                <div style={S.cardRow}>
                  <button style={S.editBtn} onClick={() => setEditing(t)}>Edit</button>
                  <button style={S.delBtn}  onClick={() => del(t._id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          {templates.length === 0 && <div style={S.empty}>No templates yet. Click "New Template" to create one.</div>}
        </div>
      )}
    </div>
  );
}
