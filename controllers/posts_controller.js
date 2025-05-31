const Post = require('../models/post')
const Comment = require('../models/comment')              
const Like = require('../models/like')
const User = require('../models/user');
const commentsMailer = require('../mailers/comments_mailer');
const queue = require('../config/kue');

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

module.exports.create = async function(req, res){

    let user = await User.findOne(req.user._id)
    // Get the total count of posts made by the user
    const totalPostsCount = await Post.countDocuments({ user: req.user._id });
    let post;
    try{
        if(totalPostsCount<40){
            post = await Post.create({
                content : req.body.content || '',
                user : req.user._id,
                imageFileName : req.body.imageFileName   // only set if image was uploaded
            })
            var formattedDateTime2 = formattedDateTime()
            let shortContent = req.body.content.length > 20 ? req.body.content.substring(0, 20) + '...' : req.body.content;
            var notification = await Notification.create({
                to_user : user._id,
                notification : `🎉Congratulations! Your new post '${shortContent}' is now published and visible to the ConnectDots community. 😊`,
                from_user : user._id,
                onModel:'None',
                count : 4,
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
        }else{
            
            return res.redirect('back');
        }

        commentsMailer.newPost(post.content,user); 
        let shortContent = post.content.length > 20 ? post.content.substring(0, 20) + '...' : post.content;
        let my_close_friends_length = user.iAmCloseFriendOf.length;
        let my_close_friend;
        for(let i=0; i<my_close_friends_length;i++){
            my_close_friend = await User.findOne(user.iAmCloseFriendOf[i])
            queue.create('emails' , { type: 'post', me:user,post: shortContent,my_close_friend: my_close_friend }).save(function(err){  
                if(err){return;}
            })       
        }
        if(req.xhr){
            return res.status(200).json({
                data:{
                    post:post,
                    user: {
                        name: req.user.name,
                        id: req.user._id
                    }
                },
                message : "Post Created!"
            })
        }
        req.flash("success" , "Post Published!");
        return res.redirect('back');
    }
    catch(err){
        
    }
    
}


module.exports.destroy =  async function(req , res){
    
    try {
        let post = await Post.findById(req.params.id);
        if(post.user == req.user.id || req.user.email=='manaschougule2019@gmail.com'){
            
            await Like.deleteMany({likeable: post, onModel: 'Post'});
            await Like.deleteMany({_id: {$in: post.comments}});

               
            let  deleted= await post.deleteOne();
            
            let comments = await Comment.deleteMany({post : req.params.id});

            let user = await User.findOne(req.user._id)
            var formattedDateTime2 = formattedDateTime()
            let shortContent = post.content.length > 20 ? post.content.substring(0, 20) + '...' : post.content;
            var notification = await Notification.create({
                to_user : user._id,
                notification : `You removed your post '${shortContent}'😢 `,
                from_user : user._id,
                onModel:'None',
                count : 5,
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

            if(req.xhr){
                return res.status(200).json({
                    data:{
                        post_id: req.params.id
                    },
                    message : "Post Deleted!"
                })
            }
            req.flash("success" , "Post & associated comments are deleted!");


        }
        return res.redirect('back');
    } catch (error) {
        
    }
}






































      






        







