require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
// nodemailer removed - using Brevo HTTP API instead (SMTP ports blocked on Render free tier)

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || process.env.SECRET_KEY || 'citadel_secret_key_123';

// ─── MONGODB ───
mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// ─── MODELS ───
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' },
    recoveryKey: String,
    recoveryExpires: Date
});
const User = mongoose.model('AdminUser', UserSchema, 'users');

const SiteDataSchema = new mongoose.Schema({
    hero: Array, events: Array, sermons: Array, gallery: Array, global: Object
}, { minimize: false });
const SiteData = mongoose.model('SiteData', SiteDataSchema);



const EventRegistration = require('./src/models/EventRegistration');
const Setting = require('./src/models/Setting');

// ─── SMTP ───
// Brevo SMTP requires the FROM address to be a verified sender in your Brevo account.
// We use the SMTP_USER address as the sender and set replyTo to EMAIL_FROM.
// ─── BREVO HTTP API EMAIL (replaces SMTP - works on Render free tier) ───
async function sendMail({ to, subject, html, text }) {
    const apiKey = process.env.BREVO_API_KEY || process.env.SMTP_PASS;
    const fromAddr = process.env.EMAIL_FROM;
    const fromName = process.env.EMAIL_FROM_NAME || 'Citadel of Truth';

    if (!apiKey) {
        console.error('[MAIL] BREVO_API_KEY not set');
        throw new Error('BREVO_API_KEY not configured');
    }
    if (!fromAddr) {
        console.error('[MAIL] EMAIL_FROM not set');
        throw new Error('EMAIL_FROM not configured');
    }

    const body = {
        sender: { name: fromName, email: fromAddr },
        to: [{ email: to }],
        subject,
        htmlContent: html || `<p>${text}</p>`,
        textContent: text || (html ? html.replace(/<[^>]+>/g, '') : '')
    };

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
        console.error('[MAIL] Brevo API error:', JSON.stringify(data));
        throw new Error(data.message || 'Brevo API request failed');
    }
    console.log('[MAIL] Sent to', to, '| MessageId:', data.messageId);
    return data;
}

console.log('[MAIL] Using Brevo HTTP API for email delivery');

// ─── CORS ───
function isAllowedOrigin(origin) {
    if (!origin) return true;
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
    if (/^https?:\/\/([a-z0-9-]+\.)?citadel\.local(:\d+)?$/.test(origin)) return true;
    if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(origin)) return true;
    if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/.test(origin)) return true;
    if (/^https:\/\/([a-z0-9-]+\.)?citadeloftruth\.com$/.test(origin)) return true;
    if (process.env.FRONTEND_URL) {
        const allowed = process.env.FRONTEND_URL.replace(/\/$/, '');
        if (origin === allowed) return true;
    }
    return false;
}
app.use(cors({
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) return callback(null, true);
        console.log('[CORS] Blocked:', origin);
        callback(new Error('CORS: origin not allowed'));
    },
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));

// ─── TOKEN BLACKLIST ───
const revokedTokens = new Set();

// ─── AUTH MIDDLEWARE ───
const Session = require("./src/models/Session");
const Admin = require("./src/models/Admin");

const authenticateToken = async (req, res, next) => {
    let token = req.cookies?.sessionId;

    // Fallback to Header Authorization
    if (!token) {
        const header = req.headers['authorization'] || '';
        token = header.startsWith('Bearer ') ? header.slice(7) : header;
    }

    if (!token) return res.sendStatus(401);

    // 1. Try legacy JWT verification first
    jwt.verify(token, SECRET_KEY, async (err, user) => {
        if (!err) {
            if (revokedTokens.has('user:' + user.id)) {
                return res.status(401).json({ error: 'Access revoked' });
            }
            req.user = user;
            return next();
        }

        // 2. Fallback to database session validation
        try {
            const session = await Session.findOne({ token });
            if (session && session.expires_at > new Date()) {
                req.user = { id: session.user_id, role: session.role };
                if (session.role === 'cms') {
                    req.user.name = "CMS Root";
                    req.user.email = process.env.CMS_EMAIL;
                } else {
                    const admin = await Admin.findById(session.user_id);
                    if (admin) {
                        req.user.name = admin.name;
                        req.user.email = admin.email;
                    }
                }
                return next();
            }
            return res.sendStatus(403);
        } catch (dbErr) {
            console.error('[Auth] Session validation error:', dbErr.message);
            return res.sendStatus(403);
        }
    });
};

const path = require('path');

// ─── SERVE CitadelCMS ADMIN DASHBOARD at /admin ───
const adminDistPath = path.join(__dirname, '../admin-dashboard/dist');
app.use('/admin', express.static(adminDistPath));
// Catch-all so React Router works inside /admin/* (Express 5 requires named wildcard)
app.get('/admin/*path', (req, res) => {
    res.sendFile(path.join(adminDistPath, 'index.html'));
});

// ─── HEALTH ───
app.get('/', (req, res) => res.json({ status: 'ok', message: 'Citadel API is running' }));
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));


// ─── AUTH: VERIFY (heartbeat) ───
app.get('/api/auth/verify', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    if (revokedTokens.has(token)) return res.status(401).json({ error: 'Token revoked' });
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        if (revokedTokens.has('user:' + user.id))
            return res.status(401).json({ error: 'Account revoked' });
        res.json({ valid: true, role: user.role });
    });
});

// ─── AUTH: LOGIN ───
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user && user.password === password) {
            const token = jwt.sign(
                { id: user._id, email: user.email, role: user.role },
                SECRET_KEY,
                { expiresIn: '24h' }
            );
            res.json({ token, role: user.role, userId: user._id.toString() });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── AUTH: FORGOT PASSWORD ───
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const user = await User.findOne({ email: email.toLowerCase() });
        // Always return success to prevent email enumeration
        if (!user) return res.json({ success: true });

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.recoveryKey = code;
        user.recoveryExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry
        await user.save();

        console.log(`[RECOVERY] Code for ${user.email}: ${code}`);

        try {
            await sendMail({
                to: user.email,
                subject: 'Citadel Command Centre — Password Recovery',
                html: `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d1424;color:#f0f4ff;border-radius:16px;">
                  <div style="text-align:center;margin-bottom:24px;">
                    <div style="display:inline-block;background:rgba(79,142,247,0.15);border:1px solid rgba(79,142,247,0.3);border-radius:12px;padding:12px 16px;">
                      <span style="font-size:24px;">🔐</span>
                    </div>
                  </div>
                  <h2 style="text-align:center;font-size:1.4rem;margin-bottom:8px;">Password Recovery</h2>
                  <p style="text-align:center;color:#94a3b8;margin-bottom:28px;font-size:0.9rem;">Citadel of Truth and Mercy Assembly</p>
                  <p style="margin-bottom:20px;color:#cbd5e1;">Your 6-digit recovery code is:</p>
                  <div style="text-align:center;margin:24px 0;">
                    <span style="font-size:2.5rem;font-weight:800;letter-spacing:10px;color:#4f8ef7;background:rgba(79,142,247,0.1);padding:16px 24px;border-radius:12px;display:inline-block;">${code}</span>
                  </div>
                  <p style="color:#64748b;font-size:0.82rem;text-align:center;margin-top:24px;">This code expires in <strong style="color:#f59e0b;">15 minutes</strong>. If you did not request this, ignore this email.</p>
                </div>`
            });
            res.json({ success: true, message: 'Recovery code sent to your email.' });
        } catch (mailErr) {
            console.error('[RECOVERY] Email failed:', mailErr.message);
            res.status(500).json({ error: 'Failed to send recovery email. Check SMTP configuration.' });
        }
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// ─── AUTH: VERIFY CODE ───
app.post('/api/verify-code', async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || user.recoveryKey !== code)
            return res.status(400).json({ error: 'Invalid recovery code' });
        if (user.recoveryExpires && user.recoveryExpires < new Date())
            return res.status(400).json({ error: 'Recovery code has expired. Please request a new one.' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to verify code.' });
    }
});

// ─── AUTH: RESET PASSWORD ───
app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        if (!email || !code || !newPassword)
            return res.status(400).json({ error: 'All fields required' });
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || user.recoveryKey !== code)
            return res.status(400).json({ error: 'Invalid or expired code' });
        if (user.recoveryExpires && user.recoveryExpires < new Date())
            return res.status(400).json({ error: 'Code expired. Please request a new one.' });
        user.password = newPassword;
        user.recoveryKey = undefined;
        user.recoveryExpires = undefined;
        await user.save();
        res.json({ success: true, message: 'Password reset successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reset password.' });
    }
});

// ─── AUTH: CHANGE PASSWORD ───
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        if (!user || user.password !== currentPassword)
            return res.status(401).json({ error: 'Incorrect current password' });
        user.password = newPassword;
        await user.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// ─── SITE DATA: GET ───
app.get('/api/migrate-fields', async (req, res) => {
    try {
        const FormField = require("./src/models/FormField");
        await FormField.deleteMany({ field_key: "date_of_birth" });
        await FormField.deleteMany({ field_key: "select_date" });

        const addIfMissing = async (field) => {
            const exists = await FormField.findOne({ form_type: field.form_type, field_key: field.field_key });
            if (!exists) await FormField.create(field);
        };

        const newFields = [
            { form_type: 'member_worker', field_key: 'birth_month', label: 'Birth Month', type: 'dropdown', options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], required: true, sort_order: 10, worker_only: false, active: true },
            { form_type: 'member_worker', field_key: 'birth_day', label: 'Birth Day', type: 'dropdown', options: Array.from({ length: 31 }, (_, i) => String(i + 1)), required: true, sort_order: 11, worker_only: false, active: true },
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

app.get('/api/data', async (req, res) => {
    try {
        let siteDoc = await SiteData.findOne();
        if (!siteDoc) {
            // Seed a default document if none exists
            siteDoc = await SiteData.create({ hero: [], events: [], sermons: [], gallery: [], global: {} });
        }
        res.set('Cache-Control', 'no-cache');
        return res.json(siteDoc);
    } catch (err) {
        console.error('[data] Failed to fetch SiteData from MongoDB:', err.message);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// ─── SITE DATA: SAVE ───
app.post('/api/data', authenticateToken, async (req, res) => {
    try {
        let siteDoc = await SiteData.findOne();
        const prevRaw = siteDoc || { hero: [], events: [], sermons: [], gallery: [], global: {} };
        const newData = {
            hero: req.body.hero ?? prevRaw.hero ?? [],
            events: req.body.events ?? prevRaw.events ?? [],
            sermons: req.body.sermons ?? prevRaw.sermons ?? [],
            gallery: req.body.gallery ?? prevRaw.gallery ?? [],
            global: req.body.global ?? prevRaw.global ?? {}
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
                    sendMail({
                        to: superadmin.email,
                        subject: `⚡ Site Update Deployed — ${req.user.email}`,
                        html: `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:32px;background:#0d1424;color:#f0f4ff;border-radius:16px;">
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
        console.error('Data save error:', err);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// ─── UPLOADS ───
if (process.env.CLOUDINARY_URL) cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
const storage = new CloudinaryStorage({ cloudinary, params: { folder: 'citadel', resource_type: 'auto' } });
const upload = multer({ storage });

app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: req.file.path });
});

app.post('/api/upload-frame', authenticateToken, upload.single('frame'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const url = req.file.path;

        // Save the frame URL to Settings database
        await Setting.findOneAndUpdate(
            { key: 'selfie_frame_url' },
            { value: url },
            { new: true, upsert: true }
        );

        res.json({ url });
    } catch (err) {
        console.error('Frame upload error:', err);
        res.status(500).json({ error: 'Failed to upload frame and save settings' });
    }
});


// ─── USERS: LIST ───
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.find();
        res.json(users.map(u => ({ id: u._id, email: u.email, role: u.role })));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// ─── USERS: CREATE ───
app.post('/api/users', authenticateToken, async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(409).json({ error: 'User already exists' });
        const user = await User.create({ email: email.toLowerCase(), password, role: role || 'admin' });

        res.json({ success: true, id: user._id, email: user.email, role: user.role });

        // Send welcome email with credentials
        const dashboardUrl = (process.env.FRONTEND_URL || 'https://citadeloftruth.com') + '/admin';
        const roleLabel = user.role === 'superadmin' ? 'Super Admin' : 'Admin';
        sendMail({
            to: user.email,
            subject: 'Welcome to Citadel Command Centre — Your Login Details',
            html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d1424;color:#f0f4ff;border-radius:16px;">
              <div style="text-align:center;margin-bottom:28px;">
                <div style="display:inline-block;background:rgba(79,142,247,0.15);border:1px solid rgba(79,142,247,0.3);border-radius:14px;padding:14px 18px;">
                  <span style="font-size:28px;">🛡️</span>
                </div>
                <h2 style="margin:16px 0 6px;font-size:1.4rem;">Welcome to Command Centre</h2>
                <p style="color:#64748b;font-size:0.85rem;margin:0;">Citadel of Truth and Mercy Assembly</p>
              </div>
              <p style="color:#cbd5e1;margin-bottom:20px;">You have been granted <strong style="color:#4f8ef7;">${roleLabel}</strong> access to the Citadel website dashboard. Here are your login credentials:</p>
              <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px;">
                <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                    <td style="padding:10px 0;color:#64748b;width:40%;">Email: </td>
                    <td style="padding:10px 0;font-weight:600;">${user.email}</td>
                  </tr>
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                    <td style="padding:10px 0;color:#64748b;">Password: </td>
                    <td style="padding:10px 0;font-family:monospace;font-size:1rem;color:#4f8ef7;">${password}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;color:#64748b;">Role</td>
                    <td style="padding:10px 0;"><span style="background:rgba(79,142,247,0.15);color:#4f8ef7;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;text-transform:uppercase;">${roleLabel}</span></td>
                  </tr>
                </table>
              </div>
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f8ef7,#2563eb);color:#fff;text-decoration:none;padding:13px 28px;border-radius:12px;font-weight:700;font-size:0.95rem;">Access Dashboard →</a>
              </div>
              <p style="color:#64748b;font-size:0.8rem;text-align:center;">We recommend changing your password after first login using the "My Account" feature.</p>
            </div>`
        }).catch(err => console.error('[WELCOME MAIL] Failed:', err.message));

    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// ─── USERS: REVOKE ───
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        if (req.params.id === req.user.id)
            return res.status(400).json({ error: 'Cannot revoke your own access' });

        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) return res.status(404).json({ error: 'User not found' });

        // Blacklist so heartbeat returns 401 immediately
        revokedTokens.add('user:' + req.params.id);
        await User.findByIdAndDelete(req.params.id);

        res.json({ success: true });

        // Send revocation email
        sendMail({
            to: userToDelete.email,
            subject: 'Access Revoked — Citadel Command Centre',
            html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d1424;color:#f0f4ff;border-radius:16px;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;background:rgba(244,63,94,0.12);border:1px solid rgba(244,63,94,0.25);border-radius:12px;padding:12px 16px;">
                  <span style="font-size:24px;">🚫</span>
                </div>
                <h2 style="margin:16px 0 6px;font-size:1.3rem;">Access Revoked</h2>
                <p style="color:#64748b;font-size:0.85rem;margin:0;">Citadel Command Centre</p>
              </div>
              <p style="color:#cbd5e1;line-height:1.7;">Your administrative access to the Citadel of Truth website dashboard has been revoked. You have been signed out and can no longer log in.</p>
              <p style="color:#64748b;margin-top:20px;font-size:0.85rem;">If you believe this was a mistake, please contact the church administrator directly.</p>
            </div>`
        }).catch(err => console.error('[REVOKE MAIL] Failed:', err.message));

    } catch (err) {
        console.error('Revoke user error:', err);
        res.status(500).json({ error: 'Failed to revoke user' });
    }
});

// ─── CONTACT FORM ───
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message)
        return res.status(400).json({ error: 'Name, email, and message are required' });
    try {
        await sendMail({
            to: process.env.ADMIN_NOTIFY_EMAIL || process.env.EMAIL_FROM,
            subject: `Citadel Contact: ${subject || 'New Message'}`,
            text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject || 'N/A'}\n\n${message}`
        });
        res.json({ success: true, message: "Message sent! We'll be in touch." });
    } catch (err) {
        console.error('Contact SMTP error:', err);
        res.status(500).json({ error: 'Failed to send message. Please try again later.' });
    }
});

// ─── EVENT REGISTRATION: CREATE ───
app.post('/api/register-event', async (req, res) => {
    const { name, email, phone, eventTitle, customFields } = req.body;
    if (!name || !email || !eventTitle || !phone) {
        return res.status(400).json({ error: 'Name, email, phone number, and event title are required' });
    }
    try {
        // Check for duplicate registration for this event
        const query = { eventTitle, $or: [{ email }] };
        if (phone) {
            query.$or.push({ phone });
        }

        const existing = await EventRegistration.findOne(query);
        if (existing) {
            return res.status(400).json({ error: 'This email or phone number is already registered for this event.' });
        }

        let registrationNumber = phone.replace(/[^0-9+]/g, ''); // Use clean phone number as ID

        // Save to database (including any dynamic form fields from CMS)
        const reg = await EventRegistration.create({ name, email, phone, eventTitle, registrationNumber, customFields: customFields || {} });

        // Send confirmation email
        try {
            const siteDoc = await SiteData.findOne();
            let emailContent = siteDoc?.global?.registrationEmailContent || "Thank you for registering for {eventTitle}, {name}! Your mobile number ({phone}) is your registration number. Please present it at the entrance.";
            
            // Inject variables
            emailContent = emailContent.replace(/{name}/g, name)
                                       .replace(/{eventTitle}/g, eventTitle)
                                       .replace(/{phone}/g, phone);

            await sendMail({
                to: email,
                subject: `Registration Confirmed - ${eventTitle}`,
                text: emailContent
            });
        } catch (mailErr) {
            console.error('Failed to send registration confirmation email:', mailErr);
            // We don't fail the registration if email fails, just log it.
        }

        res.json({ success: true, message: 'Successfully registered for the event!', data: reg });
    } catch (err) {
        console.error('Event Registration error:', err);
        res.status(500).json({ error: 'Failed to process registration. Please try again later.' });
    }
});

// ─── EVENT REGISTRATION: MARK ATTENDANCE ───
app.post('/api/mark-event-attendance', async (req, res) => {
    const { registrationNumber } = req.body;
    if (!registrationNumber) {
        return res.status(400).json({ error: 'Registration number is required' });
    }
    
    try {
        const reg = await EventRegistration.findOne({ 
            registrationNumber: { $regex: new RegExp(`^${registrationNumber.replace(/[^0-9+]/g, '')}$`, 'i') } 
        });

        if (!reg) {
            return res.status(404).json({ error: 'Ticket not found. Invalid registration number.' });
        }

        const siteDoc = await SiteData.findOne();
        const activeDay = siteDoc?.global?.activeAttendanceDay || 'Day 1';

        if (activeDay === 'None') {
            return res.status(400).json({ error: 'Attendance tracking is currently closed.' });
        }

        // Check if already attended for the active day
        const alreadyAttendedToday = reg.attendanceRecords.some(record => record.startsWith(activeDay));
        if (alreadyAttendedToday) {
            return res.status(400).json({ error: `Already checked in for ${activeDay}.` });
        }

        // Mark attendance
        reg.attended = true;
        const recordEntry = `${activeDay} - ${new Date().toISOString()}`;
        reg.attendanceRecords.push(recordEntry);
        await reg.save();

        res.json({
            success: true,
            message: 'Attendance marked successfully!',
            data: {
                name: reg.name,
                eventTitle: reg.eventTitle,
                activeDay: activeDay,
                totalScans: reg.attendanceRecords.length
            }
        });
    } catch (err) {
        console.error('Mark attendance error:', err);
        res.status(500).json({ error: 'Failed to mark attendance.' });
    }
});

// ─── EVENT REGISTRATIONS: LIST ───
app.get('/api/event-registrations', authenticateToken, async (req, res) => {
    try {
        const registrations = await EventRegistration.find().sort({ created_at: -1 });
        res.json(registrations);
    } catch (err) {
        console.error('Fetch registrations error:', err);
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
});

// ─── EVENT REGISTRATIONS: DELETE ───
app.delete('/api/event-registrations/:id', authenticateToken, async (req, res) => {
    try {
        await EventRegistration.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Registration deleted successfully' });
    } catch (err) {
        console.error('Delete registration error:', err);
        res.status(500).json({ error: 'Failed to delete registration' });
    }
});

// ─── EVENT REGISTRATIONS: TOGGLE ATTENDANCE ───
app.patch('/api/event-registrations/:id/attendance', authenticateToken, async (req, res) => {
    try {
        const { day } = req.body;
        const reg = await EventRegistration.findById(req.params.id);
        if (!reg) return res.status(404).json({ error: 'Registration not found' });

        if (day) {
            // Multi-day tracking: toggle specific day
            const index = reg.attendanceRecords.indexOf(day);
            if (index > -1) {
                reg.attendanceRecords.splice(index, 1);
            } else {
                reg.attendanceRecords.push(day);
            }
            // If they attended at least one day, mark overall attended as true
            reg.attended = reg.attendanceRecords.length > 0;
        } else {
            // Single-day tracking (fallback)
            reg.attended = !reg.attended;
            if (!reg.attended) reg.attendanceRecords = [];
        }

        await reg.save();
        res.json({ success: true, attended: reg.attended, attendanceRecords: reg.attendanceRecords, data: reg });
    } catch (err) {
        console.error('Toggle attendance error:', err);
        res.status(500).json({ error: 'Failed to update attendance' });
    }
});

// ─── EVENT REGISTRATIONS: STATS PER EVENT ───
app.get('/api/event-registrations/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await EventRegistration.aggregate([
            {
                $group: {
                    _id: '$eventTitle',
                    total: { $sum: 1 },
                    attended: { $sum: { $cond: ['$attended', 1, 0] } }
                }
            },
            { $sort: { total: -1 } }
        ]);
        res.json(stats);
    } catch (err) {
        console.error('Event stats error:', err);
        res.status(500).json({ error: 'Failed to fetch event stats' });
    }
});


// ─── CMS ROUTES ───
const authRouter = require("./src/routes/auth");
const usersRouter = require("./src/routes/users");
const messagesRouter = require("./src/routes/messages");
const remindersRouter = require("./src/routes/reminders");
const attendanceRouter = require("./src/routes/attendance");
const { adminsRouter, formFieldsRouter } = require("./src/routes/attendance");
const settingsRouter = require("./src/routes/settings");
const financialRouter = require("./src/routes/financial");
const reportsRouter = require("./src/routes/reports");
const databaseRouter = require("./src/routes/database");
const serviceReviewsRouter = require("./src/routes/serviceReviews");

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/messages", messagesRouter);
app.use("/reminders", remindersRouter);
app.use("/attendance", attendanceRouter);
app.use("/admins", adminsRouter);
app.use("/form-fields", formFieldsRouter);
app.use("/api/form-fields", formFieldsRouter); // public alias for programs page
app.use("/settings", settingsRouter);
app.use("/financial", financialRouter);
app.use("/reports", reportsRouter);
app.use("/database", databaseRouter);
app.use("/service-reviews", serviceReviewsRouter);

// ─── CMS SCHEDULERS ───
const { initScheduler } = require("./src/jobs/reminderScheduler");
const { initNotificationQueue } = require("./src/jobs/notificationQueue");
const { initBirthdayScheduler, fireBirthdayGreetings } = require("./src/jobs/birthdayScheduler");

try { initScheduler(); console.log("⏰ Reminder scheduler started"); } catch (err) { console.warn("Scheduler error:", err.message); }
try { initNotificationQueue(); console.log("⏰ Notification queue processor started"); } catch (err) { console.warn("Queue error:", err.message); }
try { initBirthdayScheduler(); console.log("🎂 Birthday scheduler started"); } catch (err) { console.warn("Birthday scheduler error:", err.message); }

// ─── BIRTHDAY: MANUAL TRIGGER ───
// Allows CMS admin to manually fire birthday greetings (with 365-day grace to catch all ungreeted)
app.post('/api/birthday/run-now', authenticateToken, async (req, res) => {
    try {
        const { graceDays = 365 } = req.body;
        console.log(`[Birthday] Manual trigger by admin. graceDays=${graceDays}`);
        const result = await fireBirthdayGreetings({ graceDays });
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('[Birthday] Manual trigger error:', err);
        res.status(500).json({ error: 'Failed to run birthday greetings' });
    }
});


// ─── HEALTH CHECK / PING ───
// Used by the keep-alive self-ping to prevent Render free tier from sleeping
app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', ts: new Date().toISOString() });
});


// ─── ERROR HANDLER ───
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
});

// ─── START ───
app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
    console.log('CMS backend integrated and listening');

    // ── KEEP-ALIVE SELF-PING ────────────────────────────────────────────────
    // Prevents Render free tier from sleeping, ensuring birthday cron always fires.
    // RENDER_EXTERNAL_URL is automatically injected by Render in production.
    // Set SELF_URL manually if deploying elsewhere.
    const selfUrl = process.env.RENDER_EXTERNAL_URL || process.env.SELF_URL;

    if (selfUrl) {
        const pingUrl = `${selfUrl.replace(/\/$/, '')}/api/ping`;
        const PING_INTERVAL_MS = 10 * 60 * 1000; // every 10 minutes

        const ping = () => {
            fetch(pingUrl)
                .then(r => r.json())
                .then(() => console.log(`[KeepAlive] ✅ Pinged ${pingUrl}`))
                .catch(err => console.warn(`[KeepAlive] ❌ Ping failed: ${err.message}`));
        };

        // First ping after 1 minute, then every 10 minutes
        setTimeout(() => {
            ping();
            setInterval(ping, PING_INTERVAL_MS);
        }, 60 * 1000);

        console.log(`[KeepAlive] Self-ping active → ${pingUrl} (every 10 min)`);
    } else {
        console.log('[KeepAlive] RENDER_EXTERNAL_URL / SELF_URL not set — keep-alive disabled (local dev).');
    }
});
