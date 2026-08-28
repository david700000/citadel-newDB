const express = require("express");
const Message = require("../models/Message");
const User = require("../models/User");
const { requireRole, requireAuth } = require("../middleware/auth");
const { sendViaChannels, sendBulk } = require("../services/messaging");

const router = express.Router();

// ─── POST /messages/bulk ──────────────────────────────────────────────────────
router.post("/bulk", requireRole("media_admin"), async (req, res) => {
  try {
    const { message, channels, subject, target_group } = req.body;

    if (!message?.trim()) return res.status(400).json({ error: "Message is required" });
    if (!channels?.length) return res.status(400).json({ error: "Select at least one channel" });
    if (!target_group) return res.status(400).json({ error: "target_group is required" });

    let users = [];
    const isSystemRole = ['all', 'first_timer', 'member', 'worker'].includes(target_group);

    if (isSystemRole) {
      let query = {};
      if (target_group !== 'all') {
        query.tag = target_group;
      }
      users = await User.find(query).select('id full_name email phone fcm_tokens');
    } else {
      // Fetch registrations for the specified event
      const { attendanceFilter } = req.body; // 'all', 'perfect', 'partial', 'absent', 'attended:X', 'absent:X'
      const EventRegistration = require("../models/EventRegistration");
      const Attendance = require("../models/Attendance");
      
      const regs = await EventRegistration.find({ eventTitle: target_group }).select('name email phone attendanceRecords');
      const attendances = await Attendance.find({ event_name: target_group, status: 'present' }).populate('user_id', 'full_name email phone fcm_tokens');
      
      const unifiedMap = new Map(); // email -> UserData
      
      // 1. Process External Event Registrations
      for (const r of regs) {
        if (!r.email) continue;
        const normalizedDays = (r.attendanceRecords || []).map(record => {
           // record looks like "Day 1 - 2026-08..."
           return record.split(' - ')[0].trim().toLowerCase();
        });
        unifiedMap.set(r.email.toLowerCase(), {
          full_name: r.name,
          email: r.email,
          phone: r.phone,
          fcm_tokens: [],
          attendedDays: new Set(normalizedDays)
        });
      }
      
      // 2. Process Internal Attendances
      for (const a of attendances) {
        if (!a.user_id || !a.user_id.email) continue;
        const emailKey = a.user_id.email.toLowerCase();
        
        // For internal attendance, we just use the ISO date string as the "day" representation if they don't have explicit days
        // Or we map the date to the string representation. Let's just store the date string:
        const dayString = new Date(a.date).toISOString().split('T')[0]; 
        
        if (unifiedMap.has(emailKey)) {
          unifiedMap.get(emailKey).attendedDays.add(dayString);
          if (a.user_id.fcm_tokens) unifiedMap.get(emailKey).fcm_tokens = a.user_id.fcm_tokens;
        } else {
          unifiedMap.set(emailKey, {
            full_name: a.user_id.full_name,
            email: a.user_id.email,
            phone: a.user_id.phone,
            fcm_tokens: a.user_id.fcm_tokens || [],
            attendedDays: new Set([dayString])
          });
        }
      }

      let allUsers = Array.from(unifiedMap.values());
      
      // 3. Filter the unified list based on attendanceFilter
      if (attendanceFilter && attendanceFilter !== 'all') {
        const mongoose = require('mongoose');
        const SiteData = mongoose.model('SiteData');
        const siteDoc = await SiteData.findOne();
        const eventDef = siteDoc?.events?.find(e => e.title === target_group);
        const daysCount = eventDef && eventDef.eventDays ? eventDef.eventDays.split(',').length : 1;

        allUsers = allUsers.filter(u => {
          const count = u.attendedDays.size;
          if (attendanceFilter === 'perfect') return count >= daysCount;
          if (attendanceFilter === 'partial') return count > 0 && count < daysCount;
          if (attendanceFilter === 'absent') return count === 0;
          
          if (attendanceFilter.startsWith('attended:')) {
            const day = attendanceFilter.split(':')[1].trim().toLowerCase();
            return Array.from(u.attendedDays).some(rec => rec.startsWith(day));
          }
          if (attendanceFilter.startsWith('absent:')) {
            const day = attendanceFilter.split(':')[1].trim().toLowerCase();
            return !Array.from(u.attendedDays).some(rec => rec.startsWith(day));
          }
          return true;
        });
      }

      users = allUsers.map(u => ({
        full_name: u.full_name,
        email: u.email,
        phone: u.phone,
        fcm_tokens: u.fcm_tokens
      }));
    }

    if (users.length === 0) return res.json({ sent: 0, message: `No recipients found for target group: ${target_group}` });

    const sendResults = await sendBulk({
      users,
      subject: subject || `Message from ${process.env.CHURCH_NAME || "Church"}`,
      message,
      channels,
    });

    const msg = await Message.create({
      sender_id: req.user.id,
      sender_name: req.user.name,
      target_type: 'bulk',
      target_group: target_group,
      channels,
      message,
      type: 'bulk',
      status: 'sent'
    });

    res.json({ message: msg, stats: sendResults });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /messages/individual ────────────────────────────────────────────────
router.post("/individual", requireRole("media_admin"), async (req, res) => {
  try {
    const { user_id, message, channels, subject } = req.body;

    if (!user_id || !message?.trim()) return res.status(400).json({ error: "user_id and message required" });
    if (!channels?.length) return res.status(400).json({ error: "Select at least one channel" });

    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.tag !== "first_timer") return res.status(403).json({ error: "Individual messages can only be sent to first-timers" });

    await sendViaChannels({
      user,
      subject: subject || `Message from ${process.env.CHURCH_NAME || "Church"}`,
      message,
      channels,
    });

    const msg = await Message.create({
      sender_id: req.user.id,
      sender_name: req.user.name,
      target_type: 'individual',
      target_user_id: user._id,
      target_user_name: user.full_name,
      channels,
      message,
      type: 'individual',
      status: 'sent'
    });

    res.json({ message: msg, sent: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /messages ────────────────────────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;
    const query = {};

    if (req.user.role === "media_admin") {
      query.sender_id = req.user.id;
    }

    if (type) {
      query.type = type;
    }

    const messages = await Message.find(query)
      .sort({ created_at: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));
      
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /messages/first-timers ───────────────────────────────────────────────
router.get("/first-timers/:userId", requireRole("media_admin"), async (req, res) => {
  try {
    const messages = await Message.find({ target_user_id: req.params.userId })
      .sort({ created_at: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /messages/:id ─────────────────────────────────────────────────────
router.delete("/:id", requireRole("media_admin"), async (req, res) => {
  try {
    const deleted = await Message.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Message not found" });
    res.json({ success: true, message: "Message deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
