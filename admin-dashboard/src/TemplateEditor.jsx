import React, { useState } from 'react';
import API_URLS from './api';

// ── STYLES ────────────────────────────────────────────────────────────────────
const css = {
  wrap:      { fontFamily: "'DM Sans', sans-serif" },
  form:      { display: 'flex', flexDirection: 'column', background: '#fff', overflowY: 'auto' },
  formHead:  { padding: '22px 24px 16px', borderBottom: '1px solid #f1f5f9' },
  formTitle: { fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 },
  formSub:   { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  formBody:  { padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 22 },
  formFoot:  { padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 8 },
  // Section
  sec:       { display: 'flex', flexDirection: 'column', gap: 12 },
  secHead:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  secTitle:  { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' },
  divider:   { height: 1, background: '#f1f5f9' },
  // Fields
  label:     { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 },
  input:     { width: '100%', padding: '9px 11px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, color: '#0f172a', background: '#fafafa', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  row2:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  checkRow:  { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer', userSelect: 'none' },
  // Upload zone
  uploadZone:{ border: '1.5px dashed #cbd5e1', borderRadius: 8, padding: '18px 16px', textAlign: 'center', cursor: 'pointer', background: '#fafafa', color: '#94a3b8', fontSize: 13, transition: 'all .15s' },
  // Field card
  fieldCard: { background: '#f8fafc', border: '1px solid #e9eef4', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 },
  fieldCardHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  fieldNum:  { fontSize: 12, fontWeight: 700, color: '#64748b' },
  removeBtn: { fontSize: 11, fontWeight: 600, color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  addFieldBtn:{ fontSize: 12, fontWeight: 600, color: '#0B1F3B', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' },
  // Buttons
  btnPrimary:(dis) => ({ padding: '11px', background: dis ? '#94a3b8' : '#0B1F3B', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: dis ? 'not-allowed' : 'pointer', width: '100%' }),
  btnSecondary:{ padding: '10px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' },
  // Right panel – preview
  preview:   { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 40px', gap: 20, overflowY: 'auto' },
  previewTag:{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' },
  imgBox:    { borderRadius: 6, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', border: '1px solid #e2e8f0', background: '#e2e8f0' },
  infoBox:   { background: '#f0f6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '14px 16px', maxWidth: 380, fontSize: 13, color: '#1e3a8a', lineHeight: 1.6 },
};

const emptyField = () => ({ type: 'text', fieldName: 'Name', text: '', left: 540, top: 900, fontSize: 52, fontFamily: 'DM Sans', fontWeight: 'bold', fill: '#ffffff', textAlign: 'center', editableByUser: true, angle: 0 });

function Label({ children }) { return <span style={css.label}>{children}</span>; }
function Input({ value, onChange, placeholder, type = 'text' }) {
  return <input style={css.input} type={type} value={value} placeholder={placeholder} onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} />;
}

export default function TemplateEditor({ templateData, onSave, onCancel, uploadFile }) {
  const ex = templateData || {};
  const exPh = ex.elements?.find(e => e.type === 'placeholder') || {};
  const exTxts = ex.elements?.filter(e => e.type === 'text') || [];

  const [name, setName]               = useState(ex.name || '');
  const [description, setDescription] = useState(ex.description || '');
  const [isActive, setIsActive]       = useState(ex.isActive ?? true);
  const [canvasW, setCanvasW]         = useState(ex.canvasWidth  || 1080);
  const [canvasH, setCanvasH]         = useState(ex.canvasHeight || 1080);
  const [bgUrl, setBgUrl]             = useState(ex.backgroundUrl || '');
  const [bgUploading, setBgUploading] = useState(false);
  const [ph, setPh] = useState({ left: exPh.left||540, top: exPh.top||540, radius: exPh.radius||400, shape: exPh.shape||'circle' });
  const [fields, setFields]           = useState(exTxts.length ? exTxts : [emptyField()]);
  const [saving, setSaving]           = useState(false);

  // ── Upload background using lossless endpoint ──────────────────────────────
  const handleBgUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBgUploading(true);
    // Use the lossless graphic upload endpoint for frame graphics
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(API_URLS.TEMPLATES_GRAPHIC_UPLOAD, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ex._token || ''}` }, // token passed separately
        body: formData,
      });
      // fallback to parent uploadFile if direct fails
      const data = await res.json();
      if (res.ok && data.url) setBgUrl(data.url);
      else {
        const url = await uploadFile(file);
        if (url) setBgUrl(url);
      }
    } catch {
      const url = await uploadFile(file);
      if (url) setBgUrl(url);
    }
    setBgUploading(false);
  };

  const updateField = (i, k, v) => setFields(p => p.map((f, idx) => idx === i ? { ...f, [k]: v } : f));
  const removeField = (i) => setFields(p => p.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!name.trim()) { alert('Please enter a template name.'); return; }
    setSaving(true);
    const elements = [
      { type: 'placeholder', shape: ph.shape, left: ph.left, top: ph.top, radius: ph.radius },
      ...fields.map(f => ({ ...f, type: 'text' })),
    ];
    await onSave({ name: name.trim(), description, isActive, canvasWidth: canvasW, canvasHeight: canvasH, backgroundUrl: bgUrl, elements });
    setSaving(false);
  };

  const previewW = Math.min(canvasW, 440);
  const previewH = Math.round(previewW * canvasH / canvasW);

  return (
    <div className="te-wrap" style={css.wrap}>
      <style>{`
        .te-wrap { display: flex; min-height: 100vh; background: #f8fafc; }
        .te-form { width: 360px; flex-shrink: 0; border-right: 1px solid #e2e8f0; }
        .te-preview { flex: 1; }
        @media (max-width: 800px) {
          .te-wrap { flex-direction: column-reverse; }
          .te-form { width: 100%; border-right: none; border-top: 1px solid #e2e8f0; height: auto; }
          .te-preview { padding: 24px 16px !important; }
        }
      `}</style>

      {/* ── FORM PANEL ── */}
      <div className="te-form" style={css.form}>
        <div style={css.formHead}>
          <h3 style={css.formTitle}>{ex._id ? 'Edit Template' : 'New Template'}</h3>
          <p style={css.formSub}>Everything here drives the /graphics page directly</p>
        </div>

        <div style={css.formBody}>

          {/* Basics */}
          <div style={css.sec}>
            <div style={css.secTitle}>Basics</div>
            <div>
              <Label>Template Name</Label>
              <Input value={name} onChange={setName} placeholder="e.g. PIC 2026" />
            </div>
            <div>
              <Label>Description (shown to users)</Label>
              <Input value={description} onChange={setDescription} placeholder="Short description" />
            </div>
            <label style={css.checkRow}>
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
              Active — visible on the /graphics page
            </label>
          </div>

          <div style={css.divider} />

          {/* Canvas size */}
          <div style={css.sec}>
            <div style={css.secTitle}>Canvas Size</div>
            <div style={css.row2}>
              <div><Label>Width (px)</Label><Input type="number" value={canvasW} onChange={setCanvasW} placeholder="1080" /></div>
              <div><Label>Height (px)</Label><Input type="number" value={canvasH} onChange={setCanvasH} placeholder="1080" /></div>
            </div>
          </div>

          <div style={css.divider} />

          {/* Frame graphic */}
          <div style={css.sec}>
            <div style={css.secTitle}>Frame Graphic</div>
            {bgUrl ? (
              <div>
                <img src={bgUrl} alt="frame preview" style={{ width: '100%', maxHeight: 110, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0', display: 'block', marginBottom: 8 }} />
                <label style={{ ...css.uploadZone, padding: '10px', cursor: 'pointer' }}>
                  Replace graphic
                  <input type="file" accept="image/png,image/webp,image/*" onChange={handleBgUpload} style={{ display: 'none' }} />
                </label>
              </div>
            ) : (
              <label style={{ ...css.uploadZone, ...(bgUploading ? { borderColor: '#0B1F3B', color: '#0B1F3B' } : {}) }}>
                {bgUploading ? 'Uploading…' : 'Click to upload your frame graphic (PNG recommended)'}
                <input type="file" accept="image/png,image/webp,image/*" onChange={handleBgUpload} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          <div style={css.divider} />

          {/* Photo placeholder */}
          <div style={css.sec}>
            <div style={css.secTitle}>Photo Placeholder</div>
            <div style={css.row2}>
              <div><Label>Center X</Label><Input type="number" value={ph.left} onChange={v => setPh(p => ({ ...p, left: v }))} /></div>
              <div><Label>Center Y</Label><Input type="number" value={ph.top}  onChange={v => setPh(p => ({ ...p, top: v }))} /></div>
            </div>
            <div><Label>Radius (px)</Label><Input type="number" value={ph.radius} onChange={v => setPh(p => ({ ...p, radius: v }))} placeholder="400" /></div>
          </div>

          <div style={css.divider} />

          {/* Text fields */}
          <div style={css.sec}>
            <div style={css.secHead}>
              <div style={css.secTitle}>Text Fields</div>
              <button style={css.addFieldBtn} onClick={() => setFields(p => [...p, emptyField()])}>+ Add</button>
            </div>

            {fields.map((f, i) => (
              <div key={i} style={css.fieldCard}>
                <div style={css.fieldCardHead}>
                  <span style={css.fieldNum}>Field {i + 1}</span>
                  {fields.length > 1 && <button style={css.removeBtn} onClick={() => removeField(i)}>Remove</button>}
                </div>
                <div><Label>Label shown to user</Label><Input value={f.fieldName} onChange={v => updateField(i, 'fieldName', v)} placeholder="e.g. Your Name" /></div>
                <div style={css.row2}>
                  <div><Label>X position</Label><Input type="number" value={f.left} onChange={v => updateField(i, 'left', v)} /></div>
                  <div><Label>Y position</Label><Input type="number" value={f.top}  onChange={v => updateField(i, 'top', v)} /></div>
                </div>
                <div style={css.row2}>
                  <div><Label>Font size</Label><Input type="number" value={f.fontSize} onChange={v => updateField(i, 'fontSize', v)} /></div>
                  <div>
                    <Label>Colour</Label>
                    <input type="color" value={f.fill} onChange={e => updateField(i, 'fill', e.target.value)}
                      style={{ width: '100%', height: 36, padding: '2px 4px', border: '1px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', background: '#fafafa' }} />
                  </div>
                </div>
                <label style={css.checkRow}>
                  <input type="checkbox" checked={f.editableByUser} onChange={e => updateField(i, 'editableByUser', e.target.checked)} />
                  User can type into this field
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={css.formFoot}>
          <button style={css.btnPrimary(saving)} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Template'}</button>
          <button style={css.btnSecondary} onClick={onCancel}>Cancel</button>
        </div>
      </div>

      {/* ── PREVIEW PANEL ── */}
      <div className="te-preview" style={css.preview}>
        <div style={css.previewTag}>Live Preview</div>

        {bgUrl ? (
          <div style={{ ...css.imgBox, width: previewW, height: previewH }}>
            <img src={bgUrl} alt="Template preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', imageRendering: 'high-quality' }} />
          </div>
        ) : (
          <div style={{ width: previewW, height: Math.min(previewH, 380), background: '#f1f5f9', borderRadius: 6, border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
            Upload a graphic to preview it here
          </div>
        )}

        <div style={css.infoBox}>
          <strong style={{ display: 'block', marginBottom: 6, color: '#1e3a8a' }}>How coordinates work</strong>
          The canvas is <strong>{canvasW} × {canvasH}px</strong>. Origin (0, 0) is top-left.
          The photo circle center is at <strong>({ph.left}, {ph.top})</strong> with radius <strong>{ph.radius}px</strong>.
          Text field positions use the same coordinate system.
          Measure positions directly from your graphic design file.
        </div>
      </div>

    </div>
  );
}
