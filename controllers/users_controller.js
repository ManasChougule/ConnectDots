const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const fs = require('fs');          
const path = require('path');
const Friendship = require('../models/friendship');
const commentsMailer = require('../mailers/comments_mailer');
const Token = require('../models/token');
const crypto = require('crypto');
const passport = require('passport');
const Chats = require('../models/message');
const Notification = require('../models/notification');
const { all } = require('../routes/users');
const BlockedUsers = require('../models/blocked_users') 
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const env = require('../config/environment');
const { app } = require('kue');
const {getWiFiIPv4Address } = require('../helper')
const { GridFSBucket } = require('mongodb');

function formattedDateTime(){
    const date = new Date(); 
    const hours = date.getHours(); 
    const minutes = date.getMinutes(); 
    const amOrPm = hours >= 12 ? 'pm' : 'am'; 
    const formattedTime = `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')}${amOrPm}`; 
    const day = date.getDate(); 
    const month = date.getMonth() + 1; 
    const year = date.getFullYear(); 
    const formattedDate = `${day}/${month}/${year}`; 

    const formattedDateTime2 = `${formattedTime} ${formattedDate}`; 
    
    return formattedDateTime2;
}
module.exports.profile = async function(req , res){
    let profile_user
    try{
    let friendship1 = await Friendship.find({   
        from_user: req.user.id,
        to_user: req.params.id,
    });


    let friendship2 = await Friendship.find({  
        from_user: req.params.id,
        to_user: req.user.id,
    });

    let isFriend = 0; 
    if (friendship1.length > 0 || friendship2.length > 0 ) {  
      isFriend = 1; 
    }            
    if(isFriend){ 
        
        if ((friendship1[0] != undefined && friendship1['0'].status == -1) || (friendship2['0'] != undefined && friendship2['0'].status== -1)){
            isFriend = -1  
        }
    }
                  
    
    var pageNo =  parseInt(req.query.pageNo) || 1;
    const pageSize = 5 ;
    const offset = (pageNo-1)*pageSize;            

    const totalCountOfFriends = await Friendship.countDocuments({ $or: [{ from_user: req.params.id }, { to_user: req.params.id }] ,status: 1}); // 
    profile_user = await User.findById(req.params.id) 
    .populate({
        path: 'friendships',
        populate: {
            path: 'from_user'
        }
    })
    .populate({      
        path: "friendships",   
        options: { skip: offset*2 , limit: 10 }, // skip k+pageNo , limit k       
        populate: {
            path: 'to_user',
        }
    });
   
    if(!profile_user){
        return res.redirect('/');
    }
    
    // Get the total count of posts made by the user
    const totalPostsCount = await Post.countDocuments({ user: req.params.id });

    let posts = await Post.find({user:req.params.id}) 
    .skip(offset)
    .limit(11)  
    .sort({'createdAt': -1})
    .populate('user')   
    .populate({
        path : 'comments' ,
        populate : {
            path : 'user'  
        }
    })
    .populate({
        path : 'comments',
        options: { sort: { 'createdAt': -1 }, limit: 5 },  // for increamental comment loading on profile page
        populate : {
            path : 'likes' 
        }   
    })
    .populate('likes');  

    var posts_length = posts.length
    if (posts.length>=5){
        posts.splice(5)
    }  

    posts = posts.map(post => {
        if (post.imageFileName) {
            post.imageUrl = `/images/fetchImage/${post.imageFileName}`;
        }
        return post;
    });
    return res.render("user_profile" , {
        title : 'Profile : '+ profile_user.name,
        friends_list :profile_user.friendships,
        posts :posts, 
        profile_user : profile_user,    
        isFriend : isFriend,
        pageNo : pageNo,
        posts_length : posts_length ,
        totalPostsCount : totalPostsCount ,
        totalCountOfFriends : totalCountOfFriends     
    })
}catch{
    return res.redirect('/');
}

}


module.exports.update = async function (req, res) {
  // Authorization check
  if (req.user.id !== req.params.id) {
    return res.status(401).send('Unauthorized');
  }

  try {
    let user = await User.findById(req.params.id);

    User.uploadedAvatar(req, res, async function (err) {
      if (err) {
        console.error(err);
        req.flash('error', 'Error uploading avatar');
        return res.redirect('back');
      }
      
      // Update basic profile info
      user.name = req.body.name;
      user.email = req.body.email;
      if (req.file) {
        // Delete previous avatar file from GridFS (if any)
        if (user.avatar) {
          const bucket = new GridFSBucket(mongoose.connection.db, {
            bucketName: User.avatarBucket  // should be 'uploads'
          });

          // Find file by filename and delete it
          bucket.find({ filename: user.avatar }).toArray((err, files) => {
            if (!err && files.length > 0) {
              bucket.delete(files[0]._id, (deleteErr) => {
                if (deleteErr) console.error('Error deleting old avatar:', deleteErr);
              });
            }
          });
        }

        // Save new avatar filename
        user.avatar = req.file.filename;
      }

      await user.save();

      // Create a notification for profile update
      const notif = await Notification.create({
        to_user: user.id,
        from_user: user.id,
        onModel: 'None',
        notification: 'Your profile has been updated!',
        time: formattedDateTime()
      });

      // Keep notifications capped to 25
      if (user.notifications.length >= 25) {
        const oldNotifId = user.notifications.shift();
        Notification.findByIdAndDelete(oldNotifId).catch(console.error);
      }

      user.notifications.push(notif.id);
      user.isAnyNotificationReceived = true;
      user.countOfNewlyReceivedNotifications += 1;

      await user.save();

      return res.redirect('back');
    });

  } catch (err) {
    console.error(err);
    req.flash('error', err.message);
    return res.redirect('back');
  }
};





module.exports.signUp = function(req,res){
    if(req.isAuthenticated()){
        return res.redirect('/users/profile');
    }
    return res.render('user_sign_up' , {
        title : 'Register'
    })
}



module.exports.signIn = function(req,res){
    if(req.isAuthenticated()){
        return res.redirect('/users/profile');
    }
    return res.render('user_sign_in' , {
        title : 'ConnectDots | Sign In' 
    })
} 


function verify_strength_of_password(password) {
    if (password.length < 8) {
        return 0; 
    }

    if (!/[a-z]/.test(password)) {
        return  1;
    }

    if (!/[A-Z]/.test(password)) {
        return  2;
    }

    if (!/\d/.test(password)) {
        return  3;
    }

    const specialChars = "!@#$%^&*()-_=+[]{};:,.<>?";
    if (![...password].some(char => specialChars.includes(char))) {
        return  4;
    }

    if (password.length > 30){
        return 5
    }
    return  6;
}


module.exports.create = async function(req, res){
    var blocked_user =  await BlockedUsers.findOne({email:req.body.email})
    if(blocked_user){
        req.flash('error' , "Your access has been restricted !");
        return res.redirect('back');
    }
    if(req.body.password != req.body.confirm_password){
        return res.redirect('back');  
    }
    const strength = verify_strength_of_password(req.body.password);
    if (strength < 6){
        return res.render('user_sign_up' , {
            title : strength == 5 ? 'Sign Up | Password too long' : 'Sign Up | Password Strength Is Not Sufficient',
            name : req.body.name,
            email : req.body.email
        })
    }

    User.findOne({email : req.body.email})
    .then(async (user)=>{  
        if(!user){    
            User.create(req.body) 
            .then(async (user)=>{
                const randomToken = crypto.randomBytes(20).toString('hex');
                async function createToken() {
                    try {
                        let token = await Token.create({
                        access_token: randomToken,
                        toUser: user._id,
                        type: 'Email Verification',
                        });
                        commentsMailer.verifyEmailAddress(user, token);
                        return res.render('verification_email_delievered', {
                        title: 'ConnectDots | Email Verification',
                        email: req.body.email,
                        wifiIP: getWiFiIPv4Address()
                        // wifiIP: process.env.WIFI_IP + ':' + process.env.SERVER_PORT
                        });
                    } catch (err) {
                        console.error('Error creating token:', err);
                        return res.status(500).json({ message: 'Internal Server Error' });
                    }
                }
                await createToken();
            })
            .catch((err)=>{
                return ;
            })
        } else{   
            return res.redirect('/users/sign-in');
        }
    })
    .catch((err)=>{
        return;
    })

};



module.exports.createSession = async function(req,res,next){   
    if(req.user==null || !req.user.isEmailVerified){  
        req.logout(function(err) {  
            if (err) { return next(err); }
            req.flash('success' , "You have logged out !");
        });

        return res.render('send_verification_email.ejs',{
            title : 'Send Verification Email',
            email:req.body.email
        });

    }        

    const token = jwt.sign({ userId: req.user.id }, env.jwt_secret_key, { expiresIn: '6h' });
    res.cookie('authToken', token, { httpOnly: true, secure: false });    // for production :- true & ensure server is running on https

    if(req.cookies.fromEmail && req.cookies.toEmail == req.body.email){  
        return res.redirect('/friends/add-friend-response/');   
    }       
    
    if(req.user){    
        req.flash('success' , "Logged In Successfully");
        return res.redirect('/'); 
    } 
    
};


module.exports.destroySession = function(req , res){
    
    req.logout(function(err) {  
        if (err) { return next(err); }
        req.flash('success' , "You have logged out !");
        
        
        return res.redirect('/');
    });
}

module.exports.forgotPass = function(req , res){
    return res.render('enter_email',{
        title : 'enter email'
    });
}

module.exports.verifyEmail = async function(req , res){
    let user = await  User.findOne({email : req.body.email}).populate('notifications');
    if(user){
        const randomToken = crypto.randomBytes(20).toString('hex');
        let token  = await Token.findOneAndDelete({
            toUser : user._id,
            type : 'Password Reset'
            }); 
        

        token  = await Token.create({
        access_token: randomToken,
        toUser : user._id,
        type: 'Password Reset'
        });   
        commentsMailer.resetPasswordEmail(user,token);

        var formattedDateTime2 = formattedDateTime()
        var notification = await Notification.create({
            to_user : user._id,
            notification : 'A password reset email has been sent. Please check your email.😊',
            from_user : user._id,
            onModel:'None',
            count : 3,
            time : formattedDateTime2   
        })
        if(user.notifications.length>= 25){
            let firstOne = user.notifications.shift();
            Notification.findByIdAndDelete(firstOne._id.toString())
            .catch((err) => {
                console.error('Error deleting notification:', err);
            });
        }
        user.notifications.push(notification.id)
        user.isAnyNotificationReceived = true;
        user.countOfNewlyReceivedNotifications += 1;
        user.save()

        req.flash('success' , "mail is delieverd , check your email!");
        return res.redirect('back');
    }else{
        req.flash('success' , "user with this email does not exists, enter valid email!");
        return res.redirect('back');
    }
}



module.exports.resetPass = async function(req , res){

    let raw = req.params.token;                   
    raw = raw.split('&')[0];                       
    const decoded = decodeURIComponent(raw);        
    const tokenObj = JSON.parse(decoded);
    const id = new mongoose.Types.ObjectId(tokenObj._id);
    const token = await Token.findById(id);
    
    if(token==null){
        req.flash('error', "This reset password link has expired"); 
        return res.redirect('/users/sign-in');
    }    
    
    return res.render('reset_password',{
        title: 'reset password',
        username : req.params.user_name,
        useremail : req.params.user_email,
        token:req.params.token,
    });
}

module.exports.changePass = async function(req , res){
    if(req.body.new_password != req.body.confirm_password){
        req.flash('error' , "Passwords didn't match");
        return res.redirect('back');
    }else{
        let user = await User.findOne({email: req.params.user_email}).populate('notifications');
        if (!user) {
            req.flash('error', 'Invalid request');
            return res.redirect('back');
        }
        user.password = req.body.new_password;

        var formattedDateTime2 = formattedDateTime()
        var notification = await Notification.create({
            to_user : user._id,
            notification : 'Your password has been changed successfully🎉. Please use your new password to log in from now on😊.',
            from_user : user._id,
            onModel:'None',
            count : 2,
            time : formattedDateTime2   
        })
        if(user.notifications.length>= 25){
            let firstOne = user.notifications.shift();
            Notification.findByIdAndDelete(firstOne._id.toString())
            .catch((err) => {
                console.error('Error deleting notification:', err);
            });
        }
        user.notifications.push(notification.id)
        user.isAnyNotificationReceived = true;
        user.countOfNewlyReceivedNotifications += 1;
   
        user.save();   
        req.flash('success' , "Password reset successfully");

        let { request_params } = req.params;
        let token = await Token.findOne({ token: { $eq: request_params } })
        let deleted=await Token.deleteOne(token)  
        .then((data)=>{console.log(data)}); 
        token = await Token.findOne({ token: { $eq: request_params } })

        commentsMailer.passwordResetSuccessfullyEmail(user);
        return res.render('user_sign_in',{
            title : 'ConnectDots | Sign In'
        });
    }     
}





module.exports.friendRequests = async function(req , res){
    let total_friend_requests_received;
    let pendingFriendshipRequests;
    let requests_send_still_pending=[]

    let user = await User.findOne(req.user._id)
    .populate({ 
        path: "pendingFriendshipRequests",             
        populate: {
          path: 'fromUser',    
        }
    })
    .populate({
        path: "pendingFriendshipRequests",             
        populate: {
          path: 'access_token',
        }
    })
    .populate('friendship_requests_sent');    

    pendingFriendshipRequests = user.pendingFriendshipRequests; 
    total_friend_requests_received =  pendingFriendshipRequests.length;  

    let length = user.friendship_requests_sent
    for (let i=0; i<length.length;i++){
        let user2 = await User.findById(user.friendship_requests_sent[i])
        requests_send_still_pending.push(user2)
    }

    return res.render("friend_requests",{
        title:'Friend Requests',
        pendingFriendshipRequests : pendingFriendshipRequests,
        total_friend_requests_received : total_friend_requests_received,
        requests_send_still_pending : requests_send_still_pending,
        total_requests_send_still_pending : user.friendship_requests_sent.length
    })

}




module.exports.verifyMyEmailAddress = async function(req,res){
    // let str = JSON.parse(req.params.token)._id
    // new_obj=new mongoose.Types.ObjectId(str) 
    // let token = await Token.findById(new_obj._id)
    console.log('in verifyMyEmailAddress')
    // 1. Grab raw param
    let raw = req.params.token;                     // "...%7D&source=gmail&ust=..."
    // 2. Keep only the part before any '&'
    raw = raw.split('&')[0];                        // "...%7D"
    // 3. Decode the URI component
    const decoded = decodeURIComponent(raw);        // '{"access_token":"..."}'
    // 4. Now it’s safe to parse
    const tokenObj = JSON.parse(decoded);

    const id = new mongoose.Types.ObjectId(tokenObj._id);
    const token = await Token.findById(id);
    
    if(token==null){
        req.flash('error', "This link has been expired !"); 
        return res.redirect('/users/sign-in');
    }
    let dele=await Token.deleteOne(token)    

      
    let user = await User.findOne({email: req.params.user_email}).populate('notifications');;
    if (!user) {    
        req.flash('error', 'Invalid request');
        return res.redirect('/users/sign-in');
    }

    var formattedDateTime2 = formattedDateTime()
    var notification = await Notification.create({
        to_user : user._id,
        notification : `Welcome to ConnectDots! Connect with people, ideas and opportunities. 😊`,
        from_user : user._id,
        onModel:'None',
        count : 0,
        time : formattedDateTime2   
    })
    if(user.notifications.length>= 25){
        let firstOne = user.notifications.shift();
        Notification.findByIdAndDelete(firstOne._id.toString())
        .catch((err) => {
            console.error('Error deleting notification:', err);
        });
    }
    user.notifications.push(notification.id)
    user.isEmailVerified = true;  
    user.isAnyNotificationReceived = true;
    user.countOfNewlyReceivedNotifications += 1;
    user.save();


    req.flash('success', 'Email is verified successfully, sign in now');

    commentsMailer.accountActivated(user);  
    res.redirect('/users/sign-in');
}

module.exports.sendVerificationEmail = async function(req,res){
    let user = await User.findOne({ email: req.params.user_email });
    

    if (user) {
        const randomToken = crypto.randomBytes(20).toString('hex');
        let token  = await Token.findOneAndDelete({
            toUser : user._id,
            type:'Email Verification'
            }); 
        

        token = await Token.create({
            access_token: randomToken,
            toUser:user._id,
            type:'Email Verification'
        });
        commentsMailer.verifyEmailAddress(user, token); 

        return res.render('verification_email_delievered' , {
            title : 'ConnectDots | Email Verification',
            email :  req.params.user_email,
            wifiIP: getWiFiIPv4Address()
        });

    } else {
        console.error('User not found with email: ' + req.params.user_email);
        return res.redirect('/users/sign-in');
    }
}




module.exports.displayAllUsers =  async function(req,res){
    const pageSize = 7 ;
    const pageNo =  parseInt(req.query.pageNo);
    const offset =  pageNo ? (pageNo-1)*pageSize : 0 ; 
    let users = await User.find({})
    .skip(offset)
    .limit(15)   

    var range;
    if (users.length>=7){
        range = 7
    }else{
        range = users.length 
    }
    return res.render('users.ejs' , { 
        title : 'All Users',
        users : users ,
        pageNo : pageNo || 1,
        users_length : users.length,
        range : range
    })
}



module.exports.displayAllNotifications =  async function(req,res){
    
    let user = await User.findById(req.user._id).populate('notifications');
    let notificationObjects = [];
    
    let promises = user.notifications.map(id => Notification.findById(id));
    
    let results = await Promise.all(promises);

    
    notificationObjects = results.filter(notification => notification !== null);

    let senders=[];
    var toUser = undefined;
    for (let i = 0; i < notificationObjects.length; i++) {

        let sender = await User.findById(notificationObjects[i].from_user)
        if (notificationObjects[i].count==7){
            toUser = notificationObjects[i].to_user
        }

        sender ? senders.push(sender.name) : null;
    }

    let countOfNewlyReceivedNotifications =  user.countOfNewlyReceivedNotifications
    user.countOfNewlyReceivedNotifications = 0;
    user.isAnyNotificationReceived = false;
    await user.save()
    return res.render('notifications.ejs' , { 
        title : 'Notifications',
        all_notifications : notificationObjects,
        range : notificationObjects.length,
        senders : senders,
        toUser:toUser,
        countOfNewlyReceivedNotifications : countOfNewlyReceivedNotifications
    })
}


module.exports.blockUser =  async function(req,res){
    try {
        const postsToDelete = await Post.find({ user: req.query.id }); 
        const postIds = postsToDelete.map(post => post._id); 
        for (const postId of postIds) {
            await Comment.deleteMany({ post: postId }); 
        }
        await Post.deleteMany({ user: req.query.id }); 
        await Comment.deleteMany({user: req.query.id});  
   
        await Chats.deleteMany({to_user : req.query.email}); 
        await Chats.deleteMany({user_email:req.query.email}) 
           
        const blocked_user = await User.findOne({email:req.query.email})
        var friendshipOfBlockedUser; 
        var friendOfBlockedUser
        for (let i = 0; i < blocked_user.friendships.length; i++) {
                friendshipOfBlockedUser = await Friendship.findById(blocked_user.friendships[i])
                if(friendshipOfBlockedUser && friendshipOfBlockedUser.from_user.toString() !== req.query.id){
                    friendOfBlockedUser = await User.findById(friendshipOfBlockedUser.from_user.toString())
                }else if(friendshipOfBlockedUser && friendshipOfBlockedUser.to_user.toString() !== req.query.id) {
                    friendOfBlockedUser = await User.findById(friendshipOfBlockedUser.to_user.toString())
                }
                if(friendOfBlockedUser){
                    for (let i = 0; i < friendOfBlockedUser.friendships.length; i++) {
                        
                        
                        friendOfBlockedUser.friendships = friendOfBlockedUser.friendships.filter(friendshipId =>{
                            return friendshipId.toString() !== friendshipOfBlockedUser._id.toString()
                        }
                          );
                        friendOfBlockedUser.save();
                        
                        blocked_user.friendships.splice(i, 1);
                        blocked_user.save()
                    }
                }
                await friendshipOfBlockedUser.deleteOne();
        }

        await BlockedUsers.create({email:blocked_user.email})

        await User.deleteOne(blocked_user._id);

        req.logout(function(err) {  
            if (err) { return next(err); }
            req.flash('success' , "You have logged out !");
            return res.redirect('/');
        });
                         
    } catch (error) {
        console.error('Error deleting posts:', error);
    }
}


module.exports.getCommunityAnalytics = async (req, res) => {
  try {
    // Top 5 users by number of posts
    const topPosters = await Post.aggregate([
      { $group: { _id: '$user', posts: { $sum: 1 } } },
      { $sort: { posts: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $project: { _id: 0, name: '$user.name', posts: 1 } }
    ]);

    // Avg likes per post
    const avgLikesPerPostAgg = await Post.aggregate([
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'likeable',
          as: 'likes',
          pipeline: [
            { $match: { onModel: 'Post' } }
          ]
        }
      },
      {
        $addFields: { likeCount: { $size: '$likes' } }
      },
      {
        $group: {
          _id: null,
          avg: { $avg: '$likeCount' }
        }
      }
    ]);

    const avgLikesPerPost = avgLikesPerPostAgg[0]?.avg || 0;

    // Most commented post
    const mostCommentedPost = await Post.aggregate([
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'comments'
        }
      },
      {
        $addFields: {
          commentCount: { $size: '$comments' }
        }
      },
      { $sort: { commentCount: -1 } },
      { $limit: 1 },
      { $project: { _id: 1, commentCount: 1 } }
    ]);

    // Total friendships
    const totalFriendships = await Friendship.countDocuments({ status: 1 });

    return res.json({
      topPosters,
      avgLikesPerPost,
      mostCommentedPost: mostCommentedPost[0] || null,
      totalFriendships
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching community analytics' });
  }
};

module.exports.getCommunityAnalytics = async (req, res) => {
  try {
    // Top 5 users by number of posts
    const topPosters = await Post.aggregate([
      { $group: { _id: '$user', posts: { $sum: 1 } } },
      { $sort: { posts: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $project: { _id: 0, name: '$user.name', posts: 1 } }
    ]);

    // Avg likes per post
    const avgLikesPerPostAgg = await Post.aggregate([
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'likeable',
          as: 'likes',
          pipeline: [
            { $match: { onModel: 'Post' } }
          ]
        }
      },
      {
        $addFields: { likeCount: { $size: '$likes' } }
      },
      {
        $group: {
          _id: null,
          avg: { $avg: '$likeCount' }
        }
      }
    ]);

    const avgLikesPerPost = avgLikesPerPostAgg[0]?.avg || 0;

    // Most commented post
    const mostCommentedPost = await Post.aggregate([
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'comments'
        }
      },
      {
        $addFields: {
          commentCount: { $size: '$comments' }
        }
      },
      { $sort: { commentCount: -1 } },
      { $limit: 1 },
      { $project: { _id: 1, commentCount: 1 } }
    ]);

    // Total friendships on community
    const totalFriendships = await Friendship.countDocuments({ status: 1 });

    return res.json({
      topPosters,
      avgLikesPerPost,
      mostCommentedPost: mostCommentedPost[0] || null,
      totalFriendships
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching community analytics' });
  }
};
