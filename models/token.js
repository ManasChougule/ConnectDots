const mongoose = require('mongoose');


const tokenSchema = new mongoose.Schema({
    access_token: {
        type: String,
        required: true
    },
    fromUser:{    
        type: mongoose.Schema.Types.ObjectId,  // needs in token in pendingFriendshipRequests , to display info of fromUser in friend_requests.ejs page
        ref: 'User'
    },
    toUser:{  // needed to send reset password mail especially to expire or to make invalid old reset password mails
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isvalid: {
        type: Boolean
    },
    type:{
        type: String
    }
 
},{
    timestamps: true
});

const Token = mongoose.model('Token', tokenSchema);
module.exports = Token;