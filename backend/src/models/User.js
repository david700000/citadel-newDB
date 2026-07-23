const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    full_name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    phone: { type: String },
    tag: {
        type: String,
        required: true,
        enum: ['first_timer', 'member', 'worker']
    },
    department: { type: String },
    birth_month: { type: Number, min: 1, max: 12 },
    birth_day: { type: Number, min: 1, max: 31 },
    age_range: { type: String },
    birthday_greeted_year: { type: Number }, // tracks last year we sent a greeting (prevents duplicates)
    fcm_tokens: [{ type: String }],
    extra_fields: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for frequent lookups by tag
UserSchema.index({ tag: 1 });
// Index to efficiently find users with a birth month and day (for birthday scheduler)
UserSchema.index({ birth_month: 1, birth_day: 1 });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
