import React, { useState, useEffect, useRef } from 'react';
import * as fabric from 'fabric';

export default function TemplateEditor({ templateData, onSave, onCancel, uploadFile }) {
    const canvasRef = useRef(null);
    const fabricCanvas = useRef(null);
    
    const [name, setName] = useState(templateData?.name || 'New Template');
    const [description, setDescription] = useState(templateData?.description || '');
    const [canvasWidth, setCanvasWidth] = useState(templateData?.canvasWidth || 1080);
    const [canvasHeight, setCanvasHeight] = useState(templateData?.canvasHeight || 1080);
    const [backgroundUrl, setBackgroundUrl] = useState(templateData?.backgroundUrl || '');
    
    // Elements logic would go here. For now, a simplified editor.
    const [elements, setElements] = useState(templateData?.elements || []);
    const [activeObject, setActiveObject] = useState(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        
        // Initialize fabric canvas
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: '#f3f4f6'
        });
        
        fabricCanvas.current = canvas;
        
        canvas.on('selection:created', (e) => setActiveObject(e.selected[0]));
        canvas.on('selection:updated', (e) => setActiveObject(e.selected[0]));
        canvas.on('selection:cleared', () => setActiveObject(null));
        
        // Setup existing
        if (backgroundUrl) {
            fabric.Image.fromURL(backgroundUrl, { crossOrigin: 'anonymous' }).then(img => {
                canvas.backgroundImage = img;
                canvas.requestRenderAll();
            });
        }
        
        return () => canvas.dispose();
    }, [canvasRef, canvasWidth, canvasHeight, backgroundUrl]);
    
    const addPhotoPlaceholder = () => {
        const circle = new fabric.Circle({
            radius: 400,
            fill: 'rgba(0, 0, 255, 0.3)',
            left: 125,
            top: 115,
            // Custom properties to identify it later
            customType: 'placeholder',
            placeholderShape: 'circle'
        });
        fabricCanvas.current.add(circle);
        fabricCanvas.current.setActiveObject(circle);
    };

    const addTextElement = () => {
        const text = new fabric.Textbox('Sample Text', {
            left: 100,
            top: 100,
            fontSize: 40,
            fontFamily: 'sans-serif',
            fill: '#000000',
            customType: 'text',
            editableByUser: true,
            fieldName: 'Name'
        });
        fabricCanvas.current.add(text);
        fabricCanvas.current.setActiveObject(text);
    };

    const handleSave = () => {
        // Serialize canvas elements
        const serializedElements = fabricCanvas.current.getObjects().map(obj => {
            const data = {
                type: obj.customType || obj.type,
                left: obj.left,
                top: obj.top,
                scaleX: obj.scaleX,
                scaleY: obj.scaleY,
                angle: obj.angle,
                width: obj.width,
                height: obj.height,
            };
            if (data.type === 'placeholder') {
                data.shape = obj.placeholderShape;
                data.radius = obj.radius;
            }
            if (data.type === 'text') {
                data.text = obj.text;
                data.fontSize = obj.fontSize;
                data.fontFamily = obj.fontFamily;
                data.fill = obj.fill;
                data.editableByUser = obj.editableByUser;
                data.fieldName = obj.fieldName;
                data.textAlign = obj.textAlign;
            }
            return data;
        });

        onSave({
            name,
            description,
            canvasWidth,
            canvasHeight,
            backgroundUrl,
            elements: serializedElements
        });
    };
    
    const handleBgUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = await uploadFile(file);
        if (url) setBackgroundUrl(url);
    };

    return (
        <div className="template-editor-container" style={{ display: 'flex', gap: '20px', padding: '20px' }}>
            <div className="editor-sidebar" style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h2>Edit Template</h2>
                
                <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Template Name" 
                    style={{ padding: '8px' }}
                />
                
                <div>
                    <label>Background Image</label>
                    <input type="file" onChange={handleBgUpload} accept="image/*" />
                </div>
                
                <button onClick={addPhotoPlaceholder} style={{ padding: '10px', background: '#3b82f6', color: 'white' }}>
                    + Add Photo Placeholder
                </button>
                
                <button onClick={addTextElement} style={{ padding: '10px', background: '#10b981', color: 'white' }}>
                    + Add Text Field
                </button>
                
                <hr />
                
                <button onClick={handleSave} style={{ padding: '12px', background: '#2563eb', color: 'white', fontWeight: 'bold' }}>
                    Save Template
                </button>
                <button onClick={onCancel} style={{ padding: '12px', background: '#ef4444', color: 'white' }}>
                    Cancel
                </button>
            </div>
            
            <div className="editor-canvas" style={{ flex: 1, overflow: 'auto', background: '#e5e7eb', padding: '20px', borderRadius: '8px' }}>
                <div style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'inline-block' }}>
                    <canvas ref={canvasRef} />
                </div>
            </div>
        </div>
    );
}
