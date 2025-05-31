//message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    to_user: String,
    message: String,
    user_email: String,
    // timestamp: { type: Date, default: Date.now }
},{
    timestamps: true
});

Message= mongoose.model('Message', messageSchema);
module.exports =Message;