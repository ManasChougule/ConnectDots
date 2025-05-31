const Like = require("../models/like");
const Post =  require("../models/post");
const Comment = require('../models/comment');
const Notification = require('../models/notification');
const User = require('../models/user');

module.exports.toggleLike = async function(req, res){
    try{

        
        let likeable;
        let deleted = false;
        let user;
        let notification;
        
        if (req.query.type == 'Post'){
            likeable = await Post.findById(req.query.id).populate('likes');
        }else{
            likeable = await Comment.findById(req.query.id).populate('likes');
        }


        
        let existingLike = await Like.findOne({
            likeable: req.query.id,
            onModel: req.query.type,
            user: req.user._id
        })


        
        if (existingLike){
            likeable.likes.pull(existingLike._id); 
            likeable.save();
            existingLike.deleteOne();
            deleted = true;

            
            if(existingLike.onModel==='Post'){
                
                let post = await Post.findById(existingLike.likeable).populate('user');
                
                notification = await Notification.findOne({
                    to_user : post.user._id,
                    notification : post.content,
                    from_user : req.user._id
                })    
                
                user = await User.findById(post.user._id)
                if(notification){
                    user.notifications=user.notifications.filter((ele)=>ele._id.toString()!==notification.id);
                    notification.deleteOne();
                }
                user.save();
            }else{
                
                let comment = await Comment.findById(existingLike.likeable).populate('user');
                
                notification = await Notification.findOne({
                    to_user : comment.user._id,
                    notification : comment.content,
                    from_user : req.user._id,
                    count : 1
                })
                
                
                user = await User.findById(comment.user._id)
                if(notification){
                    user.notifications=user.notifications.filter((ele)=>ele._id.toString()!==notification.id);
                    notification.deleteOne();
                }
                user.save();

            }   

        }else{
            
            let newLike = await Like.create({
                user: req.user._id,
                likeable: req.query.id,
                onModel: req.query.type
            });

            likeable.likes.push(newLike._id);
            likeable.save();


            var firstOne;
            var firstNotification;
            const date = new Date(); 
            const hours = date.getHours(); 
            const minutes = date.getMinutes(); 
            const amOrPm = hours >= 12 ? 'pm' : 'am'; 
            const formattedTime = `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')}${amOrPm}`; 
            const day = date.getDate(); 
            const month = date.getMonth() + 1; 
            const year = date.getFullYear(); 
            const formattedDate = `${day}/${month}/${year}`; 

            const formattedDateTime = `${formattedTime} ${formattedDate}`; 
            
            
            if(newLike.onModel==='Post'){
                let post = await Post.findById(newLike.likeable).populate('user');

                
                notification = await Notification.create({
                    to_user : post.user._id,
                    notification : post.content,
                    from_user : req.user._id,
                    onModel:'post',
                    count : 1,
                    time : formattedDateTime
                })

                
                 user = await User.findById(post.user._id).populate('notifications');
                if (user.notifications.length >= 25) {
                    firstOne = user.notifications.shift(); 
                    Notification.findByIdAndDelete(firstOne._id.toString())
                    .then((deletedNotification) => {
                        if (!deletedNotification) {
                            
                        }else{
                            
                        }
                    })
                    .catch((err) => {
                        console.error('Error deleting notification:', err);
                    });
                }
                 user.notifications.push(notification._id)
                 user.isAnyNotificationReceived = true;
                 user.countOfNewlyReceivedNotifications += 1;
                 user.save()
                
            }else{
                let comment = await Comment.findById(newLike.likeable).populate('user');
                
                notification = await Notification.create({
                    to_user : comment.user._id,
                    notification : comment.content,
                    from_user : req.user._id,
                    onModel:'comment',
                    count : 1,
                    time : formattedDateTime
                })

                
                 user = await User.findById(comment.user._id).populate('notifications');
                if (user.notifications.length >= 25) {
                    firstOne = user.notifications.shift(); 
                    Notification.findByIdAndDelete(firstOne._id.toString())
                    .then((deletedNotification) => {
                        if (!deletedNotification) {
                            
                        }else{
                            
                        }
                    })
                    .catch((err) => {
                        console.error('Error deleting notification:', err);
                    });
                }
                 user.notifications.push(notification.id)
                 user.isAnyNotificationReceived = true;
                 user.countOfNewlyReceivedNotifications += 1;
                 user.save()
                
            }   
        }
      
        return res.status(200).json({
            message: "Request successful!",
            data: {
                deleted: deleted
            }   
        })
        

    }catch(err){
        
        return res.json(500, {
            message: 'Internal Server Errorrrr'
        });
    }
}