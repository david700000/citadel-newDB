require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
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
const User = mongoose.model('User', UserSchema);

const SiteDataSchema = new mongoose.Schema({
    hero: Array, events: Array, sermons: Array, gallery: Array, global: Object
}, { minimize: false });
const SiteData = mongoose.model('SiteData', SiteDataSchema);

// ─── SMTP ───
// Brevo SMTP requires the FROM address to be a verified sender in your Brevo account.
// We use the SMTP_USER address as the sender and set replyTo to EMAIL_FROM.
// ─── BREVO HTTP API EMAIL (replaces SMTP - works on Render free tier) ───
async function sendMail({ to, subject, html, text }) {
    const apiKey   = process.env.BREVO_API_KEY;
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
        sender:   { name: fromName, email: fromAddr },
        to:       [{ email: to }],
        subject,
        htmlContent: html || `<p>${text}</p>`,
        textContent: text || (html ? html.replace(/<[^>]+>/g, '') : '')
    };

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method:  'POST',
        headers: {
            'accept':       'application/json',
            'api-key':      apiKey,
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
    if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(origin)) return true;
    if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/.test(origin)) return true;
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
app.use(express.json({ limit: '50mb' }));

// ─── TOKEN BLACKLIST ───
const revokedTokens = new Set();

// ─── AUTH MIDDLEWARE ───
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        if (revokedTokens.has('user:' + user.id))
            return res.status(401).json({ error: 'Access revoked' });
        req.user = user;
        next();
    });
};

// ─── HEALTH ───
app.get('/', (req, res) => res.json({ status: 'ok', message: 'Citadel API is running' }));

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
app.get('/api/data', async (req, res) => {
    try {
        const data = await SiteData.findOne() || { hero: [], events: [], sermons: [], gallery: [], global: {} };
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// ─── SITE DATA: SAVE (with audit email to superadmin) ───
app.post('/api/data', authenticateToken, async (req, res) => {
    try {
        const prevData = await SiteData.findOne();
        let data = prevData;
        if (!data) data = new SiteData(req.body);
        else Object.assign(data, req.body);
        await data.save();

        res.json({ success: true });

        // If saved by non-superadmin, email superadmin with audit info
        if (req.user.role !== 'superadmin') {
            const superadmin = await User.findOne({ role: 'superadmin' });
            if (!superadmin) return;

            // Build simple diff summary
            const prev = prevData || {};
            const next = req.body;
            const changes = [];
            if (JSON.stringify(prev.hero)    !== JSON.stringify(next.hero))    changes.push('Hero Slides');
            if (JSON.stringify(prev.events)  !== JSON.stringify(next.events))  changes.push('Events');
            if (JSON.stringify(prev.sermons) !== JSON.stringify(next.sermons)) changes.push('Sermons');
            if (JSON.stringify(prev.gallery) !== JSON.stringify(next.gallery)) changes.push('Gallery');
            if (JSON.stringify(prev.global)  !== JSON.stringify(next.global))  changes.push('Global Assets');

            const changedSections = changes.length > 0 ? changes.join(', ') : 'Minor updates';
            const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Lagos' });

            sendMail({
                to: superadmin.email,
                subject: `⚡ Site Update Deployed — ${req.user.email}`,
                html: `
                <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:32px;background:#0d1424;color:#f0f4ff;border-radius:16px;">
                  <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.08);">
                    <div style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:10px 14px;">
                      <span style="font-size:20px;">⚡</span>
                    </div>
                    <div>
                      <h2 style="margin:0;font-size:1.1rem;">Website Update Deployed</h2>
                      <p style="margin:4px 0 0;color:#64748b;font-size:0.8rem;">${timestamp} (WAT)</p>
                    </div>
                  </div>
                  <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                      <td style="padding:10px 0;color:#64748b;width:40%;">User</td>
                      <td style="padding:10px 0;font-weight:600;">${req.user.email}</td>
                    </tr>
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                      <td style="padding:10px 0;color:#64748b;">User ID</td>
                      <td style="padding:10px 0;font-family:monospace;font-size:0.8rem;color:#94a3b8;">${req.user.id}</td>
                    </tr>
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                      <td style="padding:10px 0;color:#64748b;">Role</td>
                      <td style="padding:10px 0;"><span style="background:rgba(79,142,247,0.15);color:#4f8ef7;padding:3px 10px;border-radius:20px;font-size:0.78rem;font-weight:700;text-transform:uppercase;">${req.user.role}</span></td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0;color:#64748b;">Changed</td>
                      <td style="padding:10px 0;color:#22c55e;font-weight:600;">${changedSections}</td>
                    </tr>
                  </table>
                  <div style="margin-top:24px;padding:14px;background:rgba(255,255,255,0.04);border-radius:10px;font-size:0.8rem;color:#64748b;">
                    This is an automated audit notification from Citadel Command Centre.
                  </div>
                </div>`
            }).catch(err => console.error('[AUDIT MAIL] Failed:', err.message));
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
        const dashboardUrl = (process.env.FRONTEND_URL || 'https://citadeloftruth.netlify.app') + '/admin.html';
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
                    <td style="padding:10px 0;color:#64748b;width:40%;">Email</td>
                    <td style="padding:10px 0;font-weight:600;">${user.email}</td>
                  </tr>
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                    <td style="padding:10px 0;color:#64748b;">Password</td>
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
              <p style="color:#64748b;font-size:0.8rem;text-align:center;">We recommend changing your password after first login using the "Forgot Password" feature.</p>
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

// ─── START ───
app.listen(PORT, () => console.log('Server running on port ' + PORT));
