const mongoose = require('mongoose');

const EventRegistrationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    eventTitle: { type: String, required: true },
    attended: { type: Boolean, default: false }
}, { 
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

module.exports = mongoose.model('EventRegistration', EventRegistrationSchema);
