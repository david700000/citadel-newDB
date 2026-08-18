const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    canvasWidth: { type: Number, default: 1080 },
    canvasHeight: { type: Number, default: 1080 },
    backgroundUrl: { type: String },
    // Array of element configurations (text, placeholders, static images, shapes)
    elements: { type: Array, default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Template', TemplateSchema);
