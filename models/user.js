const mongoose = require('mongoose');
const multer = require('multer');
const { type } = require('os');
const { GridFsStorage } = require('multer-gridfs-storage');

const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required : true,
        unique : true
    } , 

    password: {
        type: String,
        required : true
    } ,

    name: {
        type: String,
        required: true
    },
    avatar :{
        type: String,
        default:'' 
    },
    friendships:[
        {
            type:  mongoose.Schema.Types.ObjectId,
            ref: 'Friendship'
        }
    ],
    pendingFriendshipRequests:[  // this is array of related to pending friend requests received by toUser but it not contains pending 'friendship'       
        {           // requests(-1) ,  this array contains token related to pending friend requests received by toUser ; 
            type:  mongoose.Schema.Types.ObjectId,      // token has fromUser attribute which indicates which user has send the request
            ref: 'Token'      
        }
    ],
    closeFriends:[   //if to_user adds from_user in his close friend list then it is not necessary that from_user also adds to_user in his
        {           // close friend list so each user has his independent close friend list
            type:  mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }
    ],

    isEmailVerified:{   // sign up -> user is created in db -> email address verification link sent to mail of user -> 
        type: Boolean,  // if user clicks on "verify my email" link -> email is verified  -> user.isEmailVerified is true now
        default:false   // if user never clicks on link & tries to sign in (as user is already created in db so never create again) ->
    },                  //  user is signed in hence user is authenticated but still unverified -> logged out user(asynchronous) & 
                        //  email address verification link is again sent to mail of the user.

    notifications : [{
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Notification'
    }],

    friendship_requests_sent :[{ // friendship_requests_sent from current user to other users (user2) , array contians id of user2 if request sent is still in pending state
        type:  String 
    }],

    isLoggedIn : {
        type:Boolean,
        default:false
    },
    
    req :{
        type:Object
    },

    iAmCloseFriendOf :[  // this list represents users_who_added_me_in_their_close_friends_list
        {
            type:  mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],

    otp : { // otp to verify mobile number of user 
        type : Number,
        default : 0
    },

    isAnyNotificationReceived : {
        type:Boolean,
        default:false
    },

    countOfNewlyReceivedNotifications : {
        type : Number,
        default : 0
    },
    totalFriendRequestsReceived: {
        type : Number,
        default : 0
    },

},{
    timestamps : true
})

// ---------- GridFS storage for avatars ----------
const storage = new GridFsStorage({
  db : mongoose.connection,               // existing conn
  file : (req, file) => ({
    bucketName : 'uploads',               // avatars.files / avatars.chunks
    filename   : Date.now() + '_' + file.originalname
  })
});
  
userSchema.statics.uploadedAvatar= multer({ storage: storage }).single('avatar'); 
userSchema.statics.avatarBucket = 'uploads'; 

const User = mongoose.model('User' , userSchema);

module.exports = User;