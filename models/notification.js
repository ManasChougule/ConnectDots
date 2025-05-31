const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    to_user: String,
    notification: String,
    from_user:String,
    onModel: {
        type: String,
        required: true,
        enum: ['post', 'comment','None']
    },
    count: Number,
    time:String

},{
    timestamps: true
});

Notification= mongoose.model('Notification', notificationSchema);
module.exports =Notification;