const Post = require('../models/post');
const Chats = require('../models/message');
const User = require('../models/user');
const Like = require('../models/like');    
const Comment = require('../models/comment');
const mongoose = require('mongoose');

const getFriends = async (userId)=>{
    var friendIds=[];
    var user;
    user = await User.findById(userId).populate('friendships');
    
    for(let i=0; i<user.friendships.length;i++){
        if(!user.friendships[i].from_user.equals(userId)){
            friendIds.push(user.friendships[i].from_user)
        }else{
            friendIds.push(user.friendships[i].to_user)
            
        }
    }
    
    return friendIds;
}
    const getPostIds = async (userId, pageNo,offset) => {
        var postIds  =[];
        var friendIds = await getFriends(userId);
        

        postIds = await Post.aggregate([
            { $match: { user: { $in: friendIds } } }, 
            { $sort: { createdAt: -1 } },
            { $skip: 0 },  
            { $project: { _id: 1 } }  
            
        ]);

        
        postIds = postIds.map(item => item._id.toString());
        
        return postIds;
    };

module.exports.home =  async function(req,res){                                  
    
    var pageNo =  parseInt(req.query.pageNo) || 1;
    var posts;
     
    const pageSize = 5 ;
    const offset = (pageNo-1)*pageSize;
    var postIds=[];
    try{
        if(req.user){
            postIds = await getPostIds(req.user._id, pageNo,offset);  
        
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
        
            user.totalFriendRequestsReceived = user.pendingFriendshipRequests.length;;
            user.save();

        }else{
            if(req.customUser){
                postIds = await getPostIds(req.customUser.userId, pageNo,offset);
            }
        }

        var size;
        if(50-postIds.length<0){
            size=0
        }else{
            size = 50-postIds.length
        }
        
        let admin = await User.findOne({email: "manaschougule2019@gmail.com"}) 

        // after fetching admin
        let likedPostIds = [];
        let commentedPostIds = [];

        if (admin) { // null when database empty
            const likes = await Like.find({ user: admin._id, onModel: 'Post' });
            likedPostIds = likes.map(like => like.likeable.toString());

            const comments = await Comment.find({ user: admin._id });
            commentedPostIds = comments.map(c => c.post.toString());
        }

        const liked_and_commented_PostIds = likedPostIds.filter(id =>
        commentedPostIds.includes(id)
        );
        
        const filteredPostIds = liked_and_commented_PostIds.filter(id => !postIds.includes(id));

        const featuredPostIds = filteredPostIds.slice(0, size); 

        const friends_and_featured_postIds = [...postIds , ...featuredPostIds]
        
        const objectIdArray = friends_and_featured_postIds.map(id => new mongoose.Types.ObjectId(id));

        if(50-friends_and_featured_postIds.length<0){
            size=0
        }else{
            size = 50-friends_and_featured_postIds.length
        }
        
        const randomPostIds = await Post.aggregate([
            { $match: { _id: { $nin: objectIdArray } } },  
            { $sample: { size: size } },
            { $project: { _id: 1 } } 
        ])       
        .exec();

        posts = await Post.find({ _id: { $in: [...objectIdArray, ...randomPostIds] } }) 
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
            path : 'comments' ,
            options: { sort: { 'createdAt': -1 }, limit: 5 }, 
            populate : {
                path : 'likes'
            }
        })
        .populate('likes')
      
        var posts_length = posts.length
        if (posts.length>=5){
            posts.splice(5)
        }  

        const messages = await Chats.find().exec(); 

        posts = posts.map(post => {
            if (post.imageFileName) {
                post.imageUrl = `/images/fetchImage/${post.imageFileName}`;
            }
            return post;
        });
        return res.render('home' , {   
            title : '', // Home Page, Connecting People and Ideas, Crafting Stories 
            posts : posts , 
            chats : messages,
            pageNo : pageNo || 1,
            posts_length : posts_length,
        }); 

    }
    catch(err){
        res.redirect('/');
        return;
    }
}


