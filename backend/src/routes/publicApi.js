const express = require("express");
const SiteData = require("../models/SiteData");
const EventRegistration = require("../models/EventRegistration");
const User = require("../models/User");
const { requireAuth, requireCMS } = require("../middleware/auth");
const { sendEmail } = require("../services/messaging");
const formFieldsRouter = require("./attendance").formFieldsRouter;

const router = express.Router();

// ─── ALIAS FOR FORM FIELDS (Frontend uses /api/form-fields) ───
router.use("/form-fields", formFieldsRouter);

// ─── TEMPORARY MIGRATION ENDPOINT ───
router.get("/migrate-fields", async (req, res) => {
    try {
        const FormField = require("../models/FormField");
        await FormField.deleteMany({ field_key: "date_of_birth" });
        await FormField.deleteMany({ field_key: "select_date" });

        const addIfMissing = async (field) => {
            const exists = await FormField.findOne({ form_type: field.form_type, field_key: field.field_key });
            if (!exists) await FormField.create(field);
        };

        const newFields = [
            { form_type: 'member_worker', field_key: 'birth_month', label: 'Birth Month', type: 'dropdown', options: ['1','2','3','4','5','6','7','8','9','10','11','12'], required: true, sort_order: 10, worker_only: false, active: true },
            { form_type: 'member_worker', field_key: 'birth_day', label: 'Birth Day', type: 'dropdown', options: Array.from({length: 31}, (_, i) => String(i + 1)), required: true, sort_order: 11, worker_only: false, active: true },
            { form_type: 'member_worker', field_key: 'age_range', label: 'Age Range', type: 'dropdown', options: ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'], required: true, sort_order: 12, worker_only: false, active: true },
            { form_type: 'first_timer', field_key: 'address', label: 'Residential Address', type: 'text', options: [], required: true, sort_order: 5, worker_only: false, active: true },
            { form_type: 'member_worker', field_key: 'address', label: 'Residential Address', type: 'text', options: [], required: true, sort_order: 5, worker_only: false, active: true }
        ];

        for (const f of newFields) {
            await addIfMissing(f);
        }

        res.json({ success: true, message: "Migration complete!" });
    } catch (err) {
        console.error("Migration error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ─── SITE DATA: GET ───
router.get("/data", async (req, res) => {
    try {
        let siteDoc = await SiteData.findOne();
        if (!siteDoc) {
            // Seed a default document if none exists
            siteDoc = await SiteData.create({ hero: [], events: [], sermons: [], gallery: [], global: {} });
        }
        res.set("Cache-Control", "no-cache");
        return res.json(siteDoc);
    } catch (err) {
        console.error("[data] Failed to fetch SiteData from MongoDB:", err.message);
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

// ─── SITE DATA: SAVE ───
router.post("/data", requireAuth, async (req, res) => {
    try {
        let siteDoc = await SiteData.findOne();
        const prevRaw = siteDoc || { hero: [], events: [], sermons: [], gallery: [], global: {} };
        const newData = {
            hero:    req.body.hero    ?? prevRaw.hero    ?? [],
            events:  req.body.events  ?? prevRaw.events  ?? [],
            sermons: req.body.sermons ?? prevRaw.sermons ?? [],
            gallery: req.body.gallery ?? prevRaw.gallery ?? [],
            global:  req.body.global  ?? prevRaw.global  ?? {}
        };
        
        if (siteDoc) {
            siteDoc.hero = newData.hero;
            siteDoc.events = newData.events;
            siteDoc.sermons = newData.sermons;
            siteDoc.gallery = newData.gallery;
            siteDoc.global = newData.global;
            await siteDoc.save();
        } else {
            siteDoc = await SiteData.create(newData);
        }

        res.json({ success: true });

        // Audit email to superadmin (only for non-superadmin saves)
        if (req.user.role !== 'superadmin') {
            try {
                const superadmin = await User.findOne({ role: 'superadmin' });
                if (superadmin) {
                    const prev = prevRaw || {};
                    const next = req.body;
                    const changes = [];
                    if (JSON.stringify(prev.hero) !== JSON.stringify(next.hero)) changes.push('Hero Slides');
                    if (JSON.stringify(prev.events) !== JSON.stringify(next.events)) changes.push('Events');
                    if (JSON.stringify(prev.sermons) !== JSON.stringify(next.sermons)) changes.push('Sermons');
                    if (JSON.stringify(prev.gallery) !== JSON.stringify(next.gallery)) changes.push('Gallery');
                    if (JSON.stringify(prev.global) !== JSON.stringify(next.global)) changes.push('Global Assets');
                    const changedSections = changes.length > 0 ? changes.join(', ') : 'Minor updates';
                    const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Lagos' });
                    sendEmail({
                        to: superadmin.email,
                        subject: `⚡ Site Update Deployed — ${req.user.email}`,
                        htmlContent: `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:32px;background:#0d1424;color:#f0f4ff;border-radius:16px;">
                          <h2>Website Update Deployed</h2><p>${timestamp} (WAT)</p>
                          <p>User: ${req.user.email} | Changed: ${changedSections}</p>
                        </div>`
                    }).catch(err => console.error('[AUDIT MAIL] Failed:', err.message));
                }
            } catch (mailErr) {
                console.error('[AUDIT] Could not send audit email:', mailErr.message);
            }
        }
    } catch (err) {
        console.error("Data save error:", err);
        res.status(500).json({ error: "Failed to save data" });
    }
});

// ─── CONTACT FORM ───
router.post("/contact", async (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message)
        return res.status(400).json({ error: "Name, email, and message are required" });
    try {
        await sendEmail({
            to: process.env.ADMIN_NOTIFY_EMAIL || process.env.EMAIL_FROM || process.env.SMTP_USER,
            subject: `Citadel Contact: ${subject || 'New Message'}`,
            message: `Name: ${name}\nEmail: ${email}\nSubject: ${subject || 'N/A'}\n\n${message}`
        });
        res.json({ success: true, message: "Message sent! We'll be in touch." });
    } catch (err) {
        console.error("Contact SMTP error:", err);
        res.status(500).json({ error: "Failed to send message. Please try again later." });
    }
});

// ─── EVENT REGISTRATION: CREATE ───
router.post("/register-event", async (req, res) => {
    const { name, email, phone, eventTitle, customFields } = req.body;
    if (!name || !email || !eventTitle) {
        return res.status(400).json({ error: "Name, email, and event title are required" });
    }
    try {
        const reg = await EventRegistration.create({ name, email, phone, eventTitle, customFields: customFields || {} });
        res.json({ success: true, message: "Successfully registered for the event!", data: reg });
    } catch (err) {
        console.error("Event Registration error:", err);
        res.status(500).json({ error: "Failed to process registration. Please try again later." });
    }
});

// ─── EVENT REGISTRATIONS: LIST ───
router.get("/event-registrations", requireAuth, async (req, res) => {
    try {
        const registrations = await EventRegistration.find().sort({ created_at: -1 });
        res.json(registrations);
    } catch (err) {
        console.error("Fetch registrations error:", err);
        res.status(500).json({ error: "Failed to fetch registrations" });
    }
});

// ─── EVENT REGISTRATIONS: DELETE ───
router.delete("/event-registrations/:id", requireAuth, async (req, res) => {
    try {
        await EventRegistration.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Registration deleted successfully" });
    } catch (err) {
        console.error("Delete registration error:", err);
        res.status(500).json({ error: "Failed to delete registration" });
    }
});

// ─── EVENT REGISTRATIONS: TOGGLE ATTENDANCE ───
router.patch("/event-registrations/:id/attendance", requireAuth, async (req, res) => {
    try {
        const { day } = req.body;
        const reg = await EventRegistration.findById(req.params.id);
        if (!reg) return res.status(404).json({ error: "Registration not found" });

        if (day) {
            const index = reg.attendanceRecords.indexOf(day);
            if (index > -1) {
                reg.attendanceRecords.splice(index, 1);
            } else {
                reg.attendanceRecords.push(day);
            }
            reg.attended = reg.attendanceRecords.length > 0;
        } else {
            reg.attended = !reg.attended;
            if (!reg.attended) reg.attendanceRecords = [];
        }

        await reg.save();
        res.json({ success: true, attended: reg.attended, attendanceRecords: reg.attendanceRecords, data: reg });
    } catch (err) {
        console.error("Toggle attendance error:", err);
        res.status(500).json({ error: "Failed to update attendance" });
    }
});

// ─── EVENT REGISTRATIONS: STATS PER EVENT ───
router.get("/event-registrations/stats", requireAuth, async (req, res) => {
    try {
        const stats = await EventRegistration.aggregate([
            {
                $group: {
                    _id: "$eventTitle",
                    total: { $sum: 1 },
                    attended: { $sum: { $cond: ["$attended", 1, 0] } }
                }
            },
            { $sort: { total: -1 } }
        ]);
        res.json(stats);
    } catch (err) {
        console.error("Event stats error:", err);
        res.status(500).json({ error: "Failed to fetch event stats" });
    }
});

module.exports = router;
