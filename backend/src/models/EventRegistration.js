const mongoose = require('mongoose');

const EventRegistrationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    eventTitle: { type: String, required: true },
    attended: { type: Boolean, default: false },
    attendanceRecords: { type: [String], default: [] },
    customFields: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { 
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

module.exports = mongoose.model('EventRegistration', EventRegistrationSchema);

