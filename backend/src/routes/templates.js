const express = require('express');
const router = express.Router();
const Template = require('../models/Template');

// Middleware from server.js for auth is usually applied where routes are mounted
// We will assume authenticateToken is passed to admin routes or we import it.
// To keep things simple, we'll export a function that takes the auth middleware.

module.exports = (authenticateToken) => {
    // ─── PUBLIC: GET ACTIVE TEMPLATES ───
    router.get('/templates', async (req, res) => {
        try {
            const templates = await Template.find({ isActive: true }).sort({ createdAt: -1 });
            res.json(templates);
        } catch (err) {
            console.error('Fetch templates error:', err);
            res.status(500).json({ error: 'Failed to fetch templates' });
        }
    });

    // ─── ADMIN: GET ALL TEMPLATES ───
    router.get('/admin/templates', authenticateToken, async (req, res) => {
        try {
            const templates = await Template.find().sort({ createdAt: -1 });
            res.json(templates);
        } catch (err) {
            console.error('Fetch admin templates error:', err);
            res.status(500).json({ error: 'Failed to fetch templates' });
        }
    });

    // ─── ADMIN: CREATE TEMPLATE ───
    router.post('/admin/templates', authenticateToken, async (req, res) => {
        try {
            const template = await Template.create(req.body);
            res.status(201).json(template);
        } catch (err) {
            console.error('Create template error:', err);
            res.status(500).json({ error: 'Failed to create template' });
        }
    });

    // ─── ADMIN: UPDATE TEMPLATE ───
    router.put('/admin/templates/:id', authenticateToken, async (req, res) => {
        try {
            req.body.updatedAt = Date.now();
            const template = await Template.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!template) return res.status(404).json({ error: 'Template not found' });
            res.json(template);
        } catch (err) {
            console.error('Update template error:', err);
            res.status(500).json({ error: 'Failed to update template' });
        }
    });

    // ─── ADMIN: DELETE TEMPLATE ───
    router.delete('/admin/templates/:id', authenticateToken, async (req, res) => {
        try {
            const template = await Template.findByIdAndDelete(req.params.id);
            if (!template) return res.status(404).json({ error: 'Template not found' });
            res.json({ success: true });
        } catch (err) {
            console.error('Delete template error:', err);
            res.status(500).json({ error: 'Failed to delete template' });
        }
    });

    return router;
};
