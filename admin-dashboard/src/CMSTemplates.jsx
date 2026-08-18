import React, { useState, useEffect } from 'react';
import TemplateEditor from './TemplateEditor';
import API_URLS from './api';

export default function CMSTemplates({ state, toast }) {
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URLS.TEMPLATES_ADMIN, {
        headers: { 'Authorization': `Bearer ${state.session.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      toast("Failed to load templates", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSave = async (templateData) => {
    try {
      const url = editingTemplate?._id 
        ? `${API_URLS.TEMPLATES_ADMIN}/${editingTemplate._id}` 
        : API_URLS.TEMPLATES_ADMIN;
      const method = editingTemplate?._id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.session.token}`
        },
        body: JSON.stringify(templateData)
      });
      
      if (res.ok) {
        toast("Template saved successfully!", "success");
        setEditingTemplate(null);
        fetchTemplates();
      } else {
        toast("Failed to save template", "error");
      }
    } catch (err) {
      toast("Failed to save template", "error");
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(API_URLS.UPLOAD, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${state.session.token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) return data.url;
      toast(data.error || "Upload failed", "error");
      return null;
    } catch (e) {
      toast("Upload failed", "error");
      return null;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`${API_URLS.TEMPLATES_ADMIN}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${state.session.token}` }
      });
      if (res.ok) {
        toast("Template deleted", "success");
        fetchTemplates();
      } else {
        toast("Delete failed", "error");
      }
    } catch (err) {
      toast("Delete failed", "error");
    }
  };

  if (editingTemplate !== null) {
    return (
      <TemplateEditor 
        templateData={editingTemplate === 'new' ? null : editingTemplate} 
        onSave={handleSave} 
        onCancel={() => setEditingTemplate(null)} 
        uploadFile={uploadFile}
      />
    );
  }

  return (
    <div className="page-container" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Social Media Templates</h2>
        <button 
          onClick={() => setEditingTemplate('new')}
          style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
        >
          + Create New Template
        </button>
      </div>

      {loading ? (
        <p>Loading templates...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {templates.map(tpl => (
            <div key={tpl._id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ height: '200px', background: '#f3f4f6', backgroundImage: `url(${tpl.backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div style={{ padding: '16px' }}>
                <h3 style={{ margin: '0 0 8px 0' }}>{tpl.name}</h3>
                <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>{tpl.description || 'No description'}</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setEditingTemplate(tpl)}
                    style={{ flex: 1, padding: '8px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(tpl._id)}
                    style={{ padding: '8px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
              No templates found. Create one to get started!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
