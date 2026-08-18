import React, { useState } from 'react';

// ── STYLES ────────────────────────────────────────────────────────────────────
const S = {
  page:     { display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" },
  sidebar:  { width: 340, borderRight: '1px solid #e2e8f0', background: 'white', display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  sideTop:  { padding: '20px 24px', borderBottom: '1px solid #e2e8f0' },
  sideTitle:{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 },
  sideSub:  { fontSize: 12, color: '#94a3b8', marginTop: 3 },
  sideBody: { padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 },
  sideFooter:{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 },
  section:  { display: 'flex', flexDirection: 'column', gap: 12 },
  label:    { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 },
  input:    { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14, color: '#0f172a', background: '#f8fafc', outline: 'none', fontFamily: 'inherit' },
  row:      { display: 'flex', gap: 10 },
  divider:  { height: 1, background: '#f1f5f9', margin: '4px 0' },
  sectionHead: { fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  addFieldBtn: { fontSize: 12, fontWeight: 600, color: '#0B1F3B', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' },
  fieldCard:   { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 },
  fieldRow:    { display: 'flex', gap: 8 },
  removeBtn:   { fontSize: 11, color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-end' },
  saveBtn:     (disabled) => ({ padding: '12px', background: disabled ? '#94a3b8' : '#0B1F3B', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', width: '100%' }),
  cancelBtn:   { padding: '10px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' },
  preview:  { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '32px 40px', gap: 20 },
  previewLabel: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8 },
  imgFrame: { boxShadow: '0 8px 32px rgba(0,0,0,0.12)', borderRadius: 4, overflow: 'hidden', background: '#e2e8f0', position: 'relative' },
  uploadBox: { border: '2px dashed #cbd5e1', borderRadius: 8, padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', color: '#94a3b8', fontSize: 13 },
  uploadBoxActive: { borderColor: '#0B1F3B', color: '#0B1F3B', background: '#f0f4ff' },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' },
};

function Field({ label, children }) {
  return (
    <div>
      <span style={S.label}>{label}</span>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, placeholder }) {
  return (
    <input
      type="number" style={S.input} value={value} placeholder={placeholder}
      onChange={e => onChange(Number(e.target.value))}
    />
  );
}

// ── DEFAULT TEXT FIELD SHAPE ──────────────────────────────────────────────────
const newTextField = () => ({
  type: 'text',
  fieldName: 'Name',
  text: '',
  left: 540, top: 900,
  fontSize: 52,
  fontFamily: 'DM Sans',
  fontWeight: 'bold',
  fill: '#ffffff',
  textAlign: 'center',
  editableByUser: true,
  angle: 0,
});

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function TemplateEditor({ templateData, onSave, onCancel, uploadFile }) {
  const existing = templateData || {};

  const [name, setName]               = useState(existing.name || '');
  const [description, setDescription] = useState(existing.description || '');
  const [isActive, setIsActive]       = useState(existing.isActive ?? true);
  const [canvasW, setCanvasW]         = useState(existing.canvasWidth  || 1080);
  const [canvasH, setCanvasH]         = useState(existing.canvasHeight || 1080);
  const [bgUrl, setBgUrl]             = useState(existing.backgroundUrl || '');
  const [bgUploading, setBgUploading] = useState(false);
  const [saving, setSaving]           = useState(false);

  // Photo placeholder
  const existingPh = existing.elements?.find(e => e.type === 'placeholder') || {};
  const [ph, setPh] = useState({
    left:   existingPh.left   || 540,
    top:    existingPh.top    || 540,
    radius: existingPh.radius || 400,
    shape:  existingPh.shape  || 'circle',
  });

  // Text fields (user-editable)
  const existingTexts = existing.elements?.filter(e => e.type === 'text') || [];
  const [textFields, setTextFields] = useState(existingTexts.length ? existingTexts : [newTextField()]);

  // ── BACKGROUND UPLOAD ──────────────────────────────────────────────────────
  const handleBgUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBgUploading(true);
    const url = await uploadFile(file);
    if (url) setBgUrl(url);
    setBgUploading(false);
  };

  // ── TEXT FIELDS ────────────────────────────────────────────────────────────
  const updateTextField = (i, key, val) => {
    setTextFields(prev => prev.map((f, idx) => idx === i ? { ...f, [key]: val } : f));
  };
  const addTextField   = () => setTextFields(prev => [...prev, newTextField()]);
  const removeTextField = (i) => setTextFields(prev => prev.filter((_, idx) => idx !== i));

  // ── SAVE ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim()) return alert('Please enter a template name.');
    setSaving(true);
    const elements = [
      { type: 'placeholder', shape: ph.shape, left: ph.left, top: ph.top, radius: ph.radius },
      ...textFields.map(f => ({ ...f, type: 'text' })),
    ];
    await onSave({ name: name.trim(), description, isActive, canvasWidth: canvasW, canvasHeight: canvasH, backgroundUrl: bgUrl, elements });
    setSaving(false);
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>

      {/* ── LEFT SIDEBAR: FORM ── */}
      <div style={S.sidebar}>
        <div style={S.sideTop}>
          <h2 style={S.sideTitle}>{existing._id ? 'Edit Template' : 'New Template'}</h2>
          <p style={S.sideSub}>Configure what users see on the /graphics page</p>
        </div>

        <div style={S.sideBody}>

          {/* BASICS */}
          <div style={S.section}>
            <Field label="Template Name">
              <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. PIC 2026" />
            </Field>
            <Field label="Description">
              <input style={S.input} value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description shown to users" />
            </Field>
            <label style={S.checkRow}>
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
              Active — visible on the /graphics page
            </label>
          </div>

          <div style={S.divider} />

          {/* CANVAS SIZE */}
          <div style={S.section}>
            <div style={S.sectionHead}>Canvas Size</div>
            <div style={S.row}>
              <Field label="Width (px)"><NumInput value={canvasW} onChange={setCanvasW} placeholder="1080" /></Field>
              <Field label="Height (px)"><NumInput value={canvasH} onChange={setCanvasH} placeholder="1080" /></Field>
            </div>
          </div>

          <div style={S.divider} />

          {/* BACKGROUND / FRAME GRAPHIC */}
          <div style={S.section}>
            <div style={S.sectionHead}>Frame Graphic</div>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Upload your PNG graphic. The user's photo goes behind it.</p>
            {bgUrl
              ? <div style={{ position: 'relative' }}>
                  <img src={bgUrl} alt="frame" style={{ width: '100%', borderRadius: 6, maxHeight: 120, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                  <label style={{ ...S.input, display: 'block', marginTop: 8, textAlign: 'center', cursor: 'pointer', color: '#64748b' }}>
                    Replace graphic
                    <input type="file" accept="image/*" onChange={handleBgUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              : <label style={{ ...S.uploadBox, ...(bgUploading ? S.uploadBoxActive : {}) }}>
                  {bgUploading ? 'Uploading…' : 'Click to upload graphic (PNG recommended)'}
                  <input type="file" accept="image/*" onChange={handleBgUpload} style={{ display: 'none' }} />
                </label>
            }
          </div>

          <div style={S.divider} />

          {/* PHOTO PLACEHOLDER */}
          <div style={S.section}>
            <div style={S.sectionHead}>Photo Placeholder</div>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Defines where the user's photo appears on the graphic.</p>
            <div style={S.row}>
              <Field label="Center X (left)"><NumInput value={ph.left} onChange={v => setPh(p => ({ ...p, left: v }))} /></Field>
              <Field label="Center Y (top)"><NumInput value={ph.top}  onChange={v => setPh(p => ({ ...p, top: v }))} /></Field>
            </div>
            <Field label="Radius (px)">
              <NumInput value={ph.radius} onChange={v => setPh(p => ({ ...p, radius: v }))} placeholder="400" />
            </Field>
          </div>

          <div style={S.divider} />

          {/* TEXT FIELDS */}
          <div style={S.section}>
            <div style={S.sectionHead}>
              Text Fields
              <button style={S.addFieldBtn} onClick={addTextField}>+ Add Field</button>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Fields shown to users to type into (e.g. their name).</p>

            {textFields.map((f, i) => (
              <div key={i} style={S.fieldCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Field {i + 1}</span>
                  {textFields.length > 1 && <button style={S.removeBtn} onClick={() => removeTextField(i)}>Remove</button>}
                </div>

                <div style={S.fieldRow}>
                  <Field label="Field Label">
                    <input style={S.input} value={f.fieldName} placeholder="e.g. Your Name"
                      onChange={e => updateTextField(i, 'fieldName', e.target.value)} />
                  </Field>
                </div>

                <div style={S.fieldRow}>
                  <Field label="X (left)"><NumInput value={f.left} onChange={v => updateTextField(i, 'left', v)} /></Field>
                  <Field label="Y (top)"><NumInput value={f.top}  onChange={v => updateTextField(i, 'top', v)} /></Field>
                </div>

                <div style={S.fieldRow}>
                  <Field label="Font Size"><NumInput value={f.fontSize} onChange={v => updateTextField(i, 'fontSize', v)} /></Field>
                  <Field label="Color">
                    <input type="color" value={f.fill} onChange={e => updateTextField(i, 'fill', e.target.value)}
                      style={{ width: '100%', height: 36, padding: '2px 4px', border: '1px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', background: '#f8fafc' }} />
                  </Field>
                </div>

                <label style={S.checkRow}>
                  <input type="checkbox" checked={f.editableByUser} onChange={e => updateTextField(i, 'editableByUser', e.target.checked)} />
                  User can edit this field
                </label>
              </div>
            ))}
          </div>

        </div>

        {/* FOOTER BUTTONS */}
        <div style={S.sideFooter}>
          <button style={S.saveBtn(saving)} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Template'}
          </button>
          <button style={S.cancelBtn} onClick={onCancel}>Cancel</button>
        </div>
      </div>

      {/* ── RIGHT: LIVE PREVIEW ── */}
      <div style={S.preview}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Preview
        </div>
        {bgUrl ? (
          <div style={{ ...S.imgFrame, width: Math.min(canvasW, 460), height: Math.min(canvasH, 460) * (canvasH / canvasW > 1 ? 1 : canvasH / canvasW) }}>
            <img src={bgUrl} alt="Template preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ) : (
          <div style={{ width: 340, height: 340, background: '#f1f5f9', borderRadius: 4, border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
            Upload a graphic to preview it here
          </div>
        )}
        <div style={{ maxWidth: 360, fontSize: 13, color: '#64748b', lineHeight: 1.6, textAlign: 'center' }}>
          <strong style={{ color: '#0f172a' }}>How it works:</strong> The graphic above is the frame. The user's photo goes <em>behind</em> it, visible through the transparent circle at position ({ph.left}, {ph.top}) with radius {ph.radius}px.
        </div>
      </div>

    </div>
  );
}
