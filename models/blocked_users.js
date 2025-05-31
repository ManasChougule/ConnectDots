const mongoose = require('mongoose');
const blockedUsersSchema = new mongoose.Schema({
    email:{
        type: String,
        required : true,
        unique : true
    } ,
},{
    timestamps : true
})

const BlockedUsers = mongoose.model('BlockedUser', blockedUsersSchema);
module.exports = BlockedUsers;