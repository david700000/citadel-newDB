import React, { useState, useEffect, useRef } from 'react';
import * as fabric from 'fabric';

export default function TemplateEditor({ templateData, onSave, onCancel, uploadFile }) {
    const canvasRef      = useRef(null);
    const fabricCanvas   = useRef(null);
    const [saving, setSaving]           = useState(false);
    const [name, setName]               = useState(templateData?.name || 'New Template');
    const [description, setDescription] = useState(templateData?.description || '');
    const [isActive, setIsActive]       = useState(templateData?.isActive ?? true);
    const [canvasWidth]                 = useState(templateData?.canvasWidth || 1080);
    const [canvasHeight]                = useState(templateData?.canvasHeight || 1080);
    const [backgroundUrl, setBackgroundUrl] = useState(templateData?.backgroundUrl || '');
    const [selectedObj, setSelectedObj] = useState(null);

    // ── INIT CANVAS ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!canvasRef.current) return;

        const fc = new fabric.Canvas(canvasRef.current, {
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: '#e5e7eb',
            preserveObjectStacking: true,
        });
        fabricCanvas.current = fc;

        fc.on('selection:created', e => setSelectedObj(e.selected[0]));
        fc.on('selection:updated', e => setSelectedObj(e.selected[0]));
        fc.on('selection:cleared', () => setSelectedObj(null));

        // Load existing elements if editing
        if (templateData?.backgroundUrl) {
            loadBackground(fc, templateData.backgroundUrl, canvasWidth, canvasHeight);
        }
        if (templateData?.elements) {
            templateData.elements.forEach(el => restoreElement(fc, el));
        }

        return () => fc.dispose();
    }, []);

    function loadBackground(fc, url, cw, ch) {
        fabric.Image.fromURL(url, img => {
            if (!img || img.width === 0) return;
            fc.setBackgroundImage(img, fc.renderAll.bind(fc), {
                crossOrigin: 'Anonymous',
                scaleX: cw / img.width,
                scaleY: ch / img.height,
            });
        }, { crossOrigin: 'Anonymous' });
    }

    function restoreElement(fc, el) {
        if (el.type === 'placeholder') {
            const obj = new fabric.Circle({
                radius: el.radius || 400,
                fill: 'rgba(79,142,247,0.25)',
                stroke: '#4f8ef7',
                strokeWidth: 3,
                strokeDashArray: [10, 6],
                left: el.left || 0,
                top:  el.top  || 0,
                originX: 'center',
                originY: 'center',
                customType: 'placeholder',
                placeholderShape: el.shape || 'circle',
            });
            fc.add(obj);
        } else if (el.type === 'text') {
            const obj = new fabric.Text(el.text || '', {
                left: el.left || 0,
                top:  el.top  || 0,
                fontSize: el.fontSize || 40,
                fontFamily: el.fontFamily || 'sans-serif',
                fill: el.fill || '#ffffff',
                fontWeight: el.fontWeight || 'normal',
                customType: 'text',
                editableByUser: el.editableByUser || false,
                fieldName: el.fieldName || '',
            });
            fc.add(obj);
        }
        fc.renderAll();
    }

    // ── BACKGROUND UPLOAD ──────────────────────────────────────────────────────
    const handleBgUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = await uploadFile(file);
        if (!url) return;
        setBackgroundUrl(url);
        loadBackground(fabricCanvas.current, url, canvasWidth, canvasHeight);
    };

    // ── ADD ELEMENTS ───────────────────────────────────────────────────────────
    const addPhotoPlaceholder = () => {
        const circle = new fabric.Circle({
            radius: 400,
            fill: 'rgba(79,142,247,0.25)',
            stroke: '#4f8ef7',
            strokeWidth: 3,
            strokeDashArray: [10, 6],
            left: canvasWidth / 2,
            top:  canvasHeight / 2,
            originX: 'center',
            originY: 'center',
            customType: 'placeholder',
            placeholderShape: 'circle',
        });
        fabricCanvas.current.add(circle);
        fabricCanvas.current.setActiveObject(circle);
        fabricCanvas.current.renderAll();
    };

    const addTextField = () => {
        const txt = new fabric.Text('Your Name', {
            left: canvasWidth / 2,
            top:  canvasHeight * 0.8,
            originX: 'center',
            originY: 'center',
            fontSize: 60,
            fontFamily: 'sans-serif',
            fill: '#ffffff',
            customType: 'text',
            editableByUser: true,
            fieldName: 'Name',
        });
        fabricCanvas.current.add(txt);
        fabricCanvas.current.setActiveObject(txt);
        fabricCanvas.current.renderAll();
    };

    const deleteSelected = () => {
        const obj = fabricCanvas.current.getActiveObject();
        if (obj) { fabricCanvas.current.remove(obj); setSelectedObj(null); }
    };

    const bringForward = () => { fabricCanvas.current.getActiveObject()?.bringForward(); fabricCanvas.current.renderAll(); };
    const sendBackward = () => { fabricCanvas.current.getActiveObject()?.sendBackwards(); fabricCanvas.current.renderAll(); };

    // ── UPDATE SELECTED OBJECT PROPERTIES ─────────────────────────────────────
    const updateProp = (key, val) => {
        const obj = fabricCanvas.current.getActiveObject();
        if (!obj) return;
        obj.set(key, val);
        fabricCanvas.current.renderAll();
        setSelectedObj({ ...obj }); // Trigger re-render
    };

    // ── SAVE ───────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        const elements = fabricCanvas.current.getObjects().map(obj => {
            const base = {
                type:   obj.customType || obj.type,
                left:   Math.round(obj.left),
                top:    Math.round(obj.top),
                angle:  obj.angle || 0,
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
            };
            if (base.type === 'placeholder') {
                base.shape  = obj.placeholderShape || 'circle';
                base.radius = Math.round((obj.radius || 400) * (obj.scaleX || 1));
                base.width  = Math.round((obj.width  || 400) * (obj.scaleX || 1));
                base.height = Math.round((obj.height || 400) * (obj.scaleY || 1));
            }
            if (base.type === 'text') {
                base.text           = obj.text || '';
                base.fontSize       = obj.fontSize || 40;
                base.fontFamily     = obj.fontFamily || 'sans-serif';
                base.fontWeight     = obj.fontWeight || 'normal';
                base.fill           = obj.fill || '#ffffff';
                base.textAlign      = obj.textAlign || 'left';
                base.editableByUser = obj.editableByUser || false;
                base.fieldName      = obj.fieldName || '';
            }
            return base;
        });

        await onSave({ name, description, isActive, canvasWidth, canvasHeight, backgroundUrl, elements });
        setSaving(false);
    };

    // ─── RENDER ────────────────────────────────────────────────────────────────
    const editorStyle = {
        display: 'flex', height: '100vh', overflow: 'hidden',
        fontFamily: "'DM Sans', sans-serif", background: '#f8fafc',
    };
    const sidebarStyle = {
        width: 280, padding: 16, background: '#0B1F3B', color: '#f0f4ff',
        overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10,
    };
    const inputStyle = {
        width: '100%', padding: '8px 10px', borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)',
        color: '#f0f4ff', fontFamily: 'inherit', fontSize: 13,
    };
    const btnStyle = (bg) => ({
        padding: '9px 12px', borderRadius: 8, border: 'none',
        background: bg, color: 'white', cursor: 'pointer',
        fontWeight: 600, fontSize: 13, width: '100%',
    });
    const sectionLabel = { fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, marginTop: 8 };

    return (
        <div style={editorStyle}>
            {/* SIDEBAR */}
            <div style={sidebarStyle}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Template Editor</div>

                <div style={sectionLabel}>Template Name</div>
                <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Template name" />

                <div style={sectionLabel}>Description</div>
                <input style={inputStyle} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                    Active (visible to users)
                </label>

                <div style={sectionLabel}>Background Image</div>
                {backgroundUrl && <img src={backgroundUrl} alt="bg" style={{ width: '100%', borderRadius: 6, maxHeight: 90, objectFit: 'cover' }} />}
                <label style={{ ...btnStyle('#1e3a8a'), textAlign: 'center', display: 'block', cursor: 'pointer' }}>
                    {backgroundUrl ? 'Replace Graphic' : 'Upload Background PNG'}
                    <input type="file" accept="image/*" onChange={handleBgUpload} style={{ display: 'none' }} />
                </label>

                <div style={sectionLabel}>Add Elements</div>
                <button style={btnStyle('#3b82f6')} onClick={addPhotoPlaceholder}>📍 Add Photo Placeholder</button>
                <button style={btnStyle('#059669')} onClick={addTextField}>T Add Text Field</button>

                {selectedObj && (
                    <>
                        <div style={sectionLabel}>Selected Element</div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 10, fontSize: 12 }}>
                            {selectedObj.customType === 'text' && (
                                <>
                                    <div style={{ marginBottom: 6 }}>
                                        <label style={{ display: 'block', color: '#94a3b8', marginBottom: 3 }}>Text</label>
                                        <input style={inputStyle} defaultValue={selectedObj.text}
                                            onChange={e => updateProp('text', e.target.value)} />
                                    </div>
                                    <div style={{ marginBottom: 6 }}>
                                        <label style={{ display: 'block', color: '#94a3b8', marginBottom: 3 }}>Font Size</label>
                                        <input type="number" style={inputStyle} defaultValue={selectedObj.fontSize}
                                            onChange={e => updateProp('fontSize', parseInt(e.target.value))} />
                                    </div>
                                    <div style={{ marginBottom: 6 }}>
                                        <label style={{ display: 'block', color: '#94a3b8', marginBottom: 3 }}>Color</label>
                                        <input type="color" defaultValue={selectedObj.fill || '#ffffff'}
                                            onChange={e => updateProp('fill', e.target.value)} />
                                    </div>
                                    <div style={{ marginBottom: 6 }}>
                                        <label style={{ display: 'block', color: '#94a3b8', marginBottom: 3 }}>Field Name (for users)</label>
                                        <input style={inputStyle} defaultValue={selectedObj.fieldName || ''}
                                            onChange={e => updateProp('fieldName', e.target.value)} />
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                        <input type="checkbox" defaultChecked={selectedObj.editableByUser}
                                            onChange={e => updateProp('editableByUser', e.target.checked)} />
                                        User-editable field
                                    </label>
                                </>
                            )}
                            {selectedObj.customType === 'placeholder' && (
                                <div style={{ color: '#94a3b8' }}>
                                    📍 Photo Placeholder — drag to reposition, scale to resize
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button style={{ ...btnStyle('#374151'), flex: 1 }} onClick={bringForward}>↑ Forward</button>
                            <button style={{ ...btnStyle('#374151'), flex: 1 }} onClick={sendBackward}>↓ Back</button>
                        </div>
                        <button style={btnStyle('#dc2626')} onClick={deleteSelected}>🗑 Delete Element</button>
                    </>
                )}

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button style={btnStyle(saving ? '#374151' : '#2563eb')} onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : '💾 Save Template'}
                    </button>
                    <button style={btnStyle('#374151')} onClick={onCancel}>Cancel</button>
                </div>
            </div>

            {/* CANVAS AREA */}
            <div style={{ flex: 1, overflow: 'auto', background: '#e2e8f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24 }}>
                <div style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.2)', borderRadius: 4 }}>
                    <canvas ref={canvasRef} />
                </div>
            </div>
        </div>
    );
}
