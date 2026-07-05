// src/jobs/birthdayScheduler.js
//
// RELIABILITY DESIGN:
//   • Server stays alive 24/7 via self-ping keep-alive (see server.js)
//   • Fires at 08:00, 10:00, 12:00 WAT — 3 checks per day as safety net
//   • birthday_greeted_year prevents ANY duplicate greetings in same calendar year
//   • NO belated greetings — this system is designed to never miss
//
const cron = require("node-cron");
const User = require("../models/User");
const Message = require("../models/Message");
const Setting = require("../models/Setting");
const { sendViaChannels } = require("../services/messaging");

const DEFAULT_BIRTHDAY_MESSAGE =
  `🎂 Happy Birthday, {name}!\n\n` +
  `On behalf of everyone at ${process.env.CHURCH_NAME || "Citadel"}, we want to wish you a truly blessed and joyful birthday. ` +
  `May this new year of your life be filled with God's grace, good health, and overflowing happiness.\n\n` +
  `We celebrate you today and always! 🎉🙏`;

// ─── LOAD TEMPLATE FROM DB ────────────────────────────────────────────────────
async function getBirthdayTemplate() {
  try {
    const setting = await Setting.findOne({ key: "birthday_message" });
    return (setting && setting.value) ? setting.value : DEFAULT_BIRTHDAY_MESSAGE;
  } catch (err) {
    console.error("[Birthday] Failed to load template from DB, using default:", err.message);
    return DEFAULT_BIRTHDAY_MESSAGE;
  }
}

// ─── CORE: FIRE TODAY'S BIRTHDAY GREETINGS ───────────────────────────────────
// Only sends to users whose birthday is TODAY — no belated messages.
// birthday_greeted_year ensures we never send twice in the same year.
async function fireBirthdayGreetings({ checkDate = null } = {}) {
  try {
    const now = checkDate || new Date();
    const currentYear = now.getFullYear();
    const todayMonth = now.getMonth() + 1;
    const todayDay = now.getDate();

    console.log(`[Birthday] Checking today's birthdays: ${todayMonth}/${todayDay}/${currentYear}`);

    // Only look at ungreeted members/workers
    const candidates = await User.find({
      tag: { $in: ["member", "worker"] },
      $or: [
        { birthday_greeted_year: { $exists: false } },
        { birthday_greeted_year: { $ne: currentYear } }
      ]
    }).select("full_name email phone fcm_tokens date_of_birth extra_fields birthday_greeted_year");

    // Filter to only today's birthdays
    const birthdayUsers = candidates.filter((u) => {
      let dob = u.date_of_birth;
      if (!dob && u.extra_fields) {
        const ef = u.extra_fields instanceof Map ? Object.fromEntries(u.extra_fields) : u.extra_fields;
        const dobKey = Object.keys(ef || {}).find(k => /birth|dob/i.test(k));
        if (dobKey && ef[dobKey]) dob = new Date(ef[dobKey]);
      }
      if (!dob) return false;
      const d = new Date(dob);
      return d.getMonth() + 1 === todayMonth && d.getDate() === todayDay;
    });

    if (birthdayUsers.length === 0) {
      console.log("[Birthday] No birthdays today.");
      return { sent: 0, total: 0 };
    }

    console.log(`[Birthday] ${birthdayUsers.length} birthday(s) today. Sending greetings...`);
    const template = await getBirthdayTemplate();

    let successCount = 0;
    for (const user of birthdayUsers) {
      try {
        const firstName = user.full_name.split(" ")[0];
        const msgBody = template.replace(/\{name\}/g, firstName);
        const subject = `🎂 Happy Birthday, ${firstName}!`;

        await sendViaChannels({
          user,
          subject,
          message: msgBody,
          channels: ["push", "email"],
        });

        // Mark greeted for this year — prevents any duplicate
        await User.findByIdAndUpdate(user._id, { birthday_greeted_year: currentYear });
        successCount++;
        console.log(`[Birthday] ✅ Greeted: ${user.full_name} (${user.email})`);
      } catch (err) {
        console.error(`[Birthday] ❌ Failed for ${user.full_name}:`, err.message);
      }
    }

    // Write summary log to Messages collection
    if (successCount > 0) {
      await Message.create({
        sender_id: "system",
        sender_name: "Birthday System",
        target_type: "birthday",
        target_group: "members,workers",
        channels: ["push", "email"],
        message: `🎂 Birthday greetings sent to ${successCount} member(s)/worker(s) on ${todayDay}/${todayMonth}/${currentYear}.`,
        type: "birthday",
        status: "sent",
      });
    }

    console.log(`[Birthday] Done. ✅ ${successCount}/${birthdayUsers.length} greeted.`);
    return { sent: successCount, total: birthdayUsers.length };
  } catch (err) {
    console.error("[Birthday] Scheduler error:", err);
    return { sent: 0, total: 0, error: err.message };
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
function initBirthdayScheduler() {
  const opts = { timezone: "Africa/Lagos" };

  // Primary: 08:00 WAT — the main birthday greeting time
  // Backup: 10:00 and 12:00 WAT — safety net runs in case the 8AM run had a DB hiccup.
  // birthday_greeted_year ensures no user is greeted twice even if all 3 runs succeed.
  cron.schedule("0 8 * * *",  () => fireBirthdayGreetings(), opts);
  cron.schedule("0 10 * * *", () => fireBirthdayGreetings(), opts);
  cron.schedule("0 12 * * *", () => fireBirthdayGreetings(), opts);

  console.log("[Birthday] Scheduler initialized — firing at 08:00, 10:00, 12:00 WAT (Africa/Lagos).");
  console.log("[Birthday] Server kept alive via self-ping — birthday greetings will NEVER be missed.");
}

module.exports = { initBirthdayScheduler, fireBirthdayGreetings };
