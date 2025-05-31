const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema(
  {
    // the user who sent this request
    from_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // the user who accepted this request
    to_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    status:{  // status :- 1 if toUser & fromUser both are friends(i.e in friendships array of both there is friendship relation between both)
      type: Number  // status :- 0 if toUser & fromUser both are not friends ; -1 if request is sent & it is pending
    },        // in case of status = 0 & -1 in friendships array of both there is friendship relation between

    closeFriendStatus_toUser_to_fromUser:{  // friendship object is in 3 places :- in Friendship collection(which is global) , in friendships array of to_user & from_user
      type:Number   //  If to_user adds from_user in his close friend list then friendship obj. from colletion gets updated with closeFriendStatus_toUser_to_fromUser=1
    },   // old friendship obj. in friendships array of to_user & from_user gets removed & updated one is added in both

    closeFriendStatus_fromUser_to_toUser:{
      type:Number// same If to_user adds from_user in his close friend list then friendship obj. from colletion gets updated with closeFriendStatus_fromUser_to_toUser=1
    }       // old friendship obj. in friendships array of to_user & from_user gets removed & updated one is added in both
  },
  {
    timestamps: true
  }
);

const Friendship = mongoose.model('Friendship', friendshipSchema);
module.exports = Friendship;
