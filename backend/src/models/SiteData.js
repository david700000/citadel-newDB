const mongoose = require('mongoose');

const SiteDataSchema = new mongoose.Schema({
    hero: Array, 
    events: Array, 
    sermons: Array, 
    gallery: Array, 
    global: Object
}, { minimize: false });

module.exports = mongoose.model('SiteData', SiteDataSchema);
