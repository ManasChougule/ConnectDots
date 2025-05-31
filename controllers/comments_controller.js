const Comment = require('../models/comment');
const Post = require('../models/post');
const commentsMailer = require('../mailers/comments_mailer');
const queue = require('../config/kue');
const commentEmailWorker = require('../workers/comment_email_worker');
const Like = require('../models/like')

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

module.exports.create =  async function(req, res){
    try {
            let post = await Post.findById(req.body.post);
            if(post){
                
                let comment = await Comment.create({
                    content : req.body.content,
                    user : req.user._id,
                    post: req.body.post
                });
                post.comments.push(comment);
                post.save();

                post = await post.populate('user' , 'name email notifications isAnyNotificationReceived  countOfNewlyReceivedNotifications'); 

                comment = await comment   
                .populate([{  
                    path: 'user',    
                    model: 'User'
                },{
                    path: 'post',
                    model: 'Post',        
                }]); 

                comment = await comment.populate('user','notifications isAnyNotificationReceived  countOfNewlyReceivedNotifications')
                if(!post.post){ 
                    var formattedDateTime2 = formattedDateTime()
                    let shortContent1 = comment.content.length > 15 ? comment.content.substring(0, 15) + '...' : comment.content;
                    let shortContent2 = post.content.length > 15 ? post.content.substring(0, 15) + '...' : post.content;
                    
                    var notification1 = await Notification.create({
                        to_user : post.user._id,
                        notification : `has made a new comment '${shortContent1}' on your post '${shortContent2}'!`,
                        from_user : comment.user._id,
                        onModel:'None',
                        count : 9,
                        time : formattedDateTime2   
                    })
                    
                    if(post.user.notifications.length>= 25){
                        let firstOne = post.user.notifications.shift();
                        Notification.findByIdAndDelete(firstOne._id.toString())
                        .catch((err) => {
                            console.error('Error deleting notification:', err);
                        });
                    }
                    post.user.notifications.push(notification1.id)

                    post.user.isAnyNotificationReceived = true;
                    post.user.countOfNewlyReceivedNotifications += 1;
                    post.user.save()

                    var notification2 = await Notification.create({
                        to_user : comment.user._id,
                        notification : `You made a new comment '${shortContent1}' on post '${shortContent2}' of `,
                        from_user : post.user._id,
                        onModel:'None',
                        count : 10,
                        time : formattedDateTime2   
                    })
                    if(comment.user.notifications.length>= 25){
                        let firstOne = comment.user.notifications.shift();
                        Notification.findByIdAndDelete(firstOne._id.toString())
                        .catch((err) => {
                            console.error('Error deleting notification:', err);
                        });
                    }
                    comment.user.notifications.push(notification2.id)
                    comment.user.isAnyNotificationReceived = true;
                    comment.user.countOfNewlyReceivedNotifications += 1;
                    comment.user.save()
                }


                
                let job = queue.create('emails' , { type: 'comment', comment: comment.content , post:post }).save(function(err){  
                    if(err){
                        
                        return;
                    }
                    
                }) 

                

                req.flash('success', 'Comment published!');
                if (req.xhr){
                    return res.status(200).json({
                        data: {
                            comment: comment,
                            user: {
                                name: req.user.name,
                                id: req.user._id
                            }
                        },
                        message: "Comment created!"
                    });
                }
                return res.redirect('back');
            }
    } catch (error) {
        
        req.flash('error', error);
        return;
    }
}


module.exports.destroy =  async function(req,res){
    

    try {
        let comment = await Comment.findById(req.params.id);
        if(comment.user == req.user.id){
            let postId = comment.post;
            comment.deleteOne();     
            let post = await Post.findByIdAndUpdate(postId , {$pull :{comments:req.params.id}});

            
            await Like.deleteMany({likeable: comment._id, onModel: 'Comment'});

            post = await post.populate('user' , 'name notifications isAnyNotificationReceived  countOfNewlyReceivedNotifications');
            comment = await comment.populate('user','notifications isAnyNotificationReceived  countOfNewlyReceivedNotifications')
            let shortContent1 = comment.content.length > 15 ? comment.content.substring(0, 15) + '...' : comment.content;
            let shortContent2 = post.content.length > 15 ? post.content.substring(0, 15) + '...' : post.content;
            var notification1 = await Notification.findOne({
                to_user : post.user._id,
                notification : `has made a new comment '${shortContent1}' on your post '${shortContent2}'!`,
                from_user : comment.user._id,
                count : 9
            })
            if(notification1){
                post.user.notifications = post.user.notifications.filter((ele)=>ele._id.toString()!==notification1.id);
                notification1.deleteOne();
            }
            post.user.isAnyNotificationReceived = true;
            post.user.countOfNewlyReceivedNotifications += 1;
            post.user.save()

            var notification2 = await Notification.findOne({
                to_user : comment.user._id,
                notification : `You made a new comment '${shortContent1}' on post '${shortContent2}' of `,
                from_user : post.user._id,
                count : 10
            })
            if(notification2){
                comment.user.notifications = comment.user.notifications.filter((ele)=>ele._id.toString()!==notification2.id);
                notification2.deleteOne();
            }
            comment.user.isAnyNotificationReceived = true;
            comment.user.countOfNewlyReceivedNotifications += 1;
            comment.user.save()

            
            if (req.xhr){
                return res.status(200).json({
                    data: {
                        comment_id: req.params.id
                    },
                    message: "Post deleted"
                });
            }
            req.flash('success', 'Comment deleted!');
            return res.redirect('back');
            
        }
        else{
            req.flash('error', 'Unauthorized');
            return res.redirect('back');
        }
    } catch (error) {
        
        req.flash('error', error);
        return;
    }      
}




module.exports.fetchNext15Comments =  async function(req,res){
    const {postId} = req.params;
    const { skip = 0, limit = 5 } = req.query;     
    
    try{
        const comments = await Comment.find({ post: postId })    
        .sort({ 'createdAt': -1 })
        .skip(parseInt(skip))  // sending new 5 comments to front end , which gets appended below existing visible comments         
        .limit(parseInt(limit)+1)
        .populate('user likes');        
        const hasMore = comments.length > limit;
        
        return res.status(200).json({comments:comments.slice(0, limit) , hasMore});    
    }catch (error){
        
        return res.status(500).json({ error: 'Failed to load comments' });
    }
}