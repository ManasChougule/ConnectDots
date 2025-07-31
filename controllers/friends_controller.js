const Users = require("../models/user");
const Friendships = require("../models/friendship");
const commentsMailer = require('../mailers/comments_mailer');
const Token = require('../models/token');
const crypto = require('crypto');
const User = require('../models/user');
const mongoose = require('mongoose');
const { ContentAndApprovalsListInstance } = require("twilio/lib/rest/content/v1/contentAndApprovals");

function parseQueryToken(raw) {
  try {
    // If it already looks like JSON, parse directly
    return raw.trim().startsWith('{') ? JSON.parse(raw)
                                      : JSON.parse(decodeURIComponent(raw));
  } catch (err) {
    throw new Error('Malformed token query-param');
  }
}

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

module.exports.addFriend = async function(request , response){   

    try {
            

            let deleted = false;    
           
            let fromUser = await Users.findById(request.user);
            let toUser = await Users.findById(request.query.id);
            let friendship;
            
            let existingFriendship = await Friendships.findOne({
                from_user : request.user,
                to_user : request.query.id,
            });
            
            
            if(!existingFriendship){  
                existingFriendship = await Friendships.findOne({
                    from_user : request.query.id,
                    to_user : request.user,  
                });
            }   
        
            if(existingFriendship && request.query.action==='add'){
                if(request.xhr){
                    return response.status(200).json({    
                        message : "Request Successful",
                        data:{
                            deleted : false,
                            flag: 1
                        } 
                    });
                }
    
            }

            if(!existingFriendship && request.query.action==='remove'){
                

                if(request.xhr){
                    return response.status(200).json({    
                        message : "Request Successful",
                        data:{
                            deleted : false,
                            flag: 0
                        } 
                    });
                }
            }


            if(existingFriendship){
                toUser.friendships.pull(existingFriendship._id);
                fromUser.friendships.pull(existingFriendship._id);
                existingFriendship.deleteOne();  
                deleted = true;

        
                const istoUserInCloseFriendsOfFromUser = fromUser.closeFriends.some( (closeFriend) => closeFriend._id.equals(toUser._id) );   
                const isFromUserInCloseFriendsOftoUser = toUser.closeFriends.some( (closeFriend) => closeFriend._id.equals(fromUser._id) );

                if(istoUserInCloseFriendsOfFromUser && isFromUserInCloseFriendsOftoUser){  
                    fromUser.closeFriends = fromUser.closeFriends.filter(
                        (closeFriend) => !closeFriend._id.equals(toUser._id)
                    );
                    toUser.closeFriends = toUser.closeFriends.filter(
                        (closeFriend) => !closeFriend._id.equals(fromUser._id)
                    );
                    request.flash('success', 'Close Friend Removed!');
                }
                else if(istoUserInCloseFriendsOfFromUser){
                    fromUser.closeFriends = fromUser.closeFriends.filter(
                        (closeFriend) => !closeFriend._id.equals(toUser._id)
                    ); 
                    request.flash('success', 'Close Friend Removed!');
                }
                else if(isFromUserInCloseFriendsOftoUser){  
                    toUser.closeFriends = toUser.closeFriends.filter(
                        (closeFriend) => !closeFriend._id.equals(fromUser._id)
                    );
                    request.flash('success', 'Close Friend Removed!');
                } 

                await fromUser.save();  
                await toUser.save();

                request.flash('success', 'Friend Removed!');
            }else{
    
                var formattedDateTime2 = formattedDateTime()
                var notification1 = await Notification.create({
                    to_user : toUser._id,
                    notification : `has sent you a friend request! Please accept.`,
                    from_user : fromUser._id,
                    onModel:'None',
                    count : 6,
                    time : formattedDateTime2   
                })
                if(toUser.notifications.length>= 25){
                    let firstOne = toUser.notifications.shift();
                    Notification.findByIdAndDelete(firstOne._id.toString())
                    .catch((err) => {
                        console.error('Error deleting notification:', err);
                    });
                }
                toUser.notifications.push(notification1.id)
                toUser.isAnyNotificationReceived = true;
                toUser.countOfNewlyReceivedNotifications += 1;

                
                const randomToken = crypto.randomBytes(20);
                let token  = await Token.create({
                access_token: randomToken,
                });    
                commentsMailer.addFriendEmail(fromUser ,toUser,token); 
                token.fromUser = fromUser;   
                await token.save();
                toUser.pendingFriendshipRequests.push(token);  
                toUser.save();
                

                friendship = await Friendships.create({  
                    to_user : toUser.id,
                    from_user : fromUser._id,
                    status :-1,    
                    closeFriendStatus_fromUser_to_toUser:0,
                    closeFriendStatus_toUser_to_fromUser:0 
                });       
                

                var formattedDateTime2 = formattedDateTime()
                var notification = await Notification.create({
                    to_user : fromUser._id,
                    notification : `Your Friend request has been sent to ${toUser.name}. 😊`,
                    from_user : fromUser._id,
                    onModel:'None',
                    count : 8,
                    time : formattedDateTime2   
                })
                if(fromUser.notifications.length>= 25){
                    let firstOne = fromUser.notifications.shift();
                    Notification.findByIdAndDelete(firstOne._id.toString())
                    .catch((err) => {
                        console.error('Error deleting notification:', err);
                    });
                }
                fromUser.notifications.push(notification.id)
                fromUser.friendship_requests_sent.push(toUser._id.toString())
                fromUser.isAnyNotificationReceived = true;
                fromUser.countOfNewlyReceivedNotifications += 1;
                fromUser.save()
            }
            if(request.xhr){
                
                
                return response.status(200).json({    
                    message : "Request Successful",
                    data:{
                        deleted : deleted
                    } 
                });
            }

            if(deleted){
                request.flash('success', 'Friend Removed!');
            }else{
                request.flash('success', 'Friend Added!');
            }
            return response.redirect("back");


    } catch (error) {
        
        return response.json(500, {
            message: 'Internal Server Error'
        });
    }

}

module.exports.addFriendResponse = async function(request , response){
    
    var new_obj;
    var str;   
    let token ;
    if(request.cookies.token_id && Object.keys(request.query).length === 0){  
        
        new_obj=new mongoose.Types.ObjectId(request.cookies.token_id)
        token = await Token.findById(new_obj._id)  
    }else{   
            try{
        
            const tokenObj = parseQueryToken(request.query.token);
            const id = new mongoose.Types.ObjectId(tokenObj._id);
            response.cookie('token_id', tokenObj._id);
            token = await Token.findById(id._id.toString());
            if (request.cookies.fromEmail && request.cookies.fromEmail!=request.query.from_user) {
                response.cookie('fromEmail', request.query.from_user);    
                return response.redirect('/friends/add-friend-response/');  
            }else{
                response.cookie('fromEmail' ,request.query.from_user); 
                
            }    
            response.cookie('toEmail' ,request.query.to_user); 
            response.cookie('value' ,request.query.value); 
            }catch(erro){
                request.flash('error','..cannot perform this action again'); 
                return response.redirect('/');  
            }
        }

try {                                               
    if(token==null){                 
        request.flash('error','cannot perform this action again'); 
        // return response.redirect('/');             
    }     

    if(!request.isAuthenticated()){                            
        request.flash('error','Please Sign-In First');
        return response.redirect('/users/sign-in/');    
    }        
 
    if(request.cookies.fromEmail == undefined){  
        return response.redirect('/friends/add-friend-response/');        
        
    } 
    let fromUser = await Users.findOne({email:request.cookies.fromEmail});
    let toUser = await Users.findOne({email:request.cookies.toEmail});
    let friendship = await Friendships.findOne({  
        to_user : toUser.id,    
        from_user : fromUser._id,
        status :-1,    
    }/*,{$set :{'status':1}} , {new:true}*/);     
      
    
    if(friendship && request.cookies.value==="true"){       
    
        friendship.status = 1; 
        await friendship.save();  
        toUser.friendships.push(friendship);  
        fromUser.friendships.push(friendship);                   

        var formattedDateTime2 = formattedDateTime()
        var notification1 = await Notification.create({
            to_user : toUser._id,
            notification : `has been added to your friends list. You can now see their posts. 😊`,
            from_user : fromUser._id,
            onModel:'None',
            count : 7,
            time : formattedDateTime2   
        })
        if(toUser.notifications.length>= 25){
            let firstOne = toUser.notifications.shift();
            Notification.findByIdAndDelete(firstOne._id.toString())
            .catch((err) => {
                console.error('Error deleting notification:', err);
            });
        }
        toUser.notifications.push(notification1.id)

        var notification2 = await Notification.create({    
            to_user : fromUser._id,
            notification : `has been added to your friends list. You can now see their posts. 😊`,
            from_user : toUser._id, 
            onModel:'None',
            count : 7,
            time : formattedDateTime2   
        })

        if(fromUser.notifications.length>= 25){
            let firstOne = fromUser.notifications.shift();
            Notification.findByIdAndDelete(firstOne._id.toString())
            .catch((err) => {
                console.error('Error deleting notification:', err);
            });
        }
        fromUser.notifications.push(notification2.id)

        toUser.isAnyNotificationReceived = true;
        toUser.countOfNewlyReceivedNotifications += 1;
        fromUser.isAnyNotificationReceived = true;
        fromUser.countOfNewlyReceivedNotifications += 1;

        request.flash('success', fromUser.name ,'is added to your friend list!');    
    }
    else{    
        if(friendship!=null){
            await Friendships.deleteOne(friendship);
            request.flash('success', 'Friend Request is rejected!'); 
        } 
    }

    fromUser.friendship_requests_sent = fromUser.friendship_requests_sent.filter(request => request !== toUser._id.toString());
    toUser.friendship_requests_sent = toUser.friendship_requests_sent.filter(request => request !== fromUser._id.toString()); //##

    response.clearCookie("fromEmail");
    response.clearCookie("toEmail");
    response.clearCookie("value");

    let path_to_redirect = '/';
    if(token.fromUser){
        path_to_redirect = 'back' 
    }

    let deletedToken=await Token.deleteOne(token)  
    toUser.pendingFriendshipRequests.pull(token); //##

    await toUser.save();  
    await fromUser.save();
    
    return response.redirect(path_to_redirect);

    } catch (error) {
        return response.redirect('/');
    }                            
}

module.exports.closeFriends = async function(request,response){
    
    let current_user;
    let length=0;
    if (request.user){
        current_user = await User.findById(request.user._id)
        .populate({
            path: 'friendships',
            populate: {
                path: 'from_user'
            }
        })
        .populate({
          path: "friendships",             
          populate: {   
            path: 'to_user',
          }
        })
        .populate({    
            path: "friendships",             
            populate: {   
              path: 'closeFriendStatus_toUser_to_fromUser',
            }
          })
        .populate({       
            path: "friendships",             
            populate: {   
              path: 'closeFriendStatus_fromUser_to_toUser',
            }
          })
        .populate('closeFriends')};     
    
    length = current_user.friendships.length - current_user.closeFriends.length
    return response.render('close_friends.ejs',{
        title:'Your Close Friends List',
        all_friends : current_user.friendships,
        all_close_friends : current_user.closeFriends,
        length : length
    })
}


module.exports.addOrRemoveCloseFriend = async function(request,response){
    try {
        let closeFriendDeleted=0; 
        let current_user = await User.findById(request.user._id).populate('closeFriends').populate('friendships');
        let friend = await User.findById(request.query.close_friend_id).populate('iAmCloseFriendOf');

        let friendship1 = await Friendships.findOne({  
            from_user: current_user.id,
            to_user: friend.id,
        });
        let friendship2 = await Friendships.findOne({ 
            from_user: friend.id,  
            to_user: current_user.id,
        });
        let friendship_object;
        if(friendship1!=null){
            friendship_object = friendship1;
        }else{
            friendship_object = friendship2;
        }

        
        const isFriendInCloseFriends = current_user.closeFriends.some(  
        (closeFriend) => closeFriend._id.equals(friend._id)
        );

        const friendshipIndex1 = current_user.friendships.findIndex((friendship) =>friendship.equals(friendship_object));  
        
        const friendshipIndex2 = friend.friendships.findIndex((friendship) =>friendship.equals(friendship_object)); 
        
        const friendship = current_user.friendships[friendshipIndex1];
        
         
        current_user.friendships.splice(friendshipIndex1, 1);
        friend.friendships.splice(friendshipIndex2, 1);
        if (!isFriendInCloseFriends) {
            current_user.closeFriends.push(friend.id);
            
            friend.iAmCloseFriendOf.push(current_user._id);
            
            if(current_user._id.toString()==friendship.to_user.toString()){  
                friendship.closeFriendStatus_toUser_to_fromUser= 1;
            }else{
                friendship.closeFriendStatus_fromUser_to_toUser= 1;
            }
            

            current_user = await current_user.populate('notifications')
            var formattedDateTime2 = formattedDateTime()
            var notification = await Notification.create({
                to_user : current_user._id,
                notification : `has been added to your close friends list !`,
                from_user : friend.id,
                onModel:'None',
                count : 12,
                time : formattedDateTime2   
            })
            if(current_user.notifications.length>= 25){
                let firstOne = current_user.notifications.shift();
                Notification.findByIdAndDelete(firstOne._id.toString())
                .catch((err) => {
                    console.error('Error deleting notification:', err);
                });
            }
            current_user.notifications.push(notification.id)

        } else { 
            current_user.closeFriends = current_user.closeFriends.filter( (closeFriend) => !closeFriend._id.equals(friend._id) );
            
            friend.iAmCloseFriendOf=friend.iAmCloseFriendOf.filter((id)=>!id.equals(current_user.id));
            
            if(current_user._id.toString()==friendship.to_user.toString()){
                friendship.closeFriendStatus_toUser_to_fromUser= 0;
            }else{
                friendship.closeFriendStatus_fromUser_to_toUser= 0;
            }
            closeFriendDeleted=1; 
            

            var notification2 = await Notification.findOne({
                to_user : current_user._id,
                notification : `has been added to your close friends list !`,
                from_user : friend.id,
                count : 12
            })
            if(notification2){
                current_user.notifications = current_user.notifications.filter((ele)=>ele._id.toString()!==notification2.id);
                notification2.deleteOne();
            }
            
        }
        current_user.friendships.push(friendship);      
        friend.friendships.push(friendship);  
        current_user.isAnyNotificationReceived = true;
        current_user.countOfNewlyReceivedNotifications += 1;
        await friendship.save();  
        await current_user.save(); 
        await friend.save(); 

        if(request.xhr){  
            return response.status(200).json({    
                message : "Request Successful",
                data:{
                    closeFriendDeleted : closeFriendDeleted   
                } 
            });
        }
        res.redirect(req.originalUrl);
    } catch (error) {
        
        return response.redirect('/');
    }
}   




module.exports.displayAllFriends =  async function(req,res){
    let friends;
    let pending_requests;
    const pageSize = 7 ;
    const pageNo =  parseInt(req.query.pageNo) || 1;
    const offset =  pageNo ? (pageNo-1)*pageSize : 0 ; 
    
    if (req.user){
        let current_user = await User.findById(req.user._id)
        .populate({
            path: 'friendships',
            populate: {
                path: 'from_user'
            }
        })
        .populate({
          path: "friendships",     
          options: { skip : offset , limit: 15 },        
          populate: {   
            path: 'to_user',
          }
        })
        .populate("pendingFriendshipRequests");     
        friends = current_user.friendships; 
        pending_requests = current_user.pendingFriendshipRequests.length 
    }

    var range;
    if (friends.length>=7){
        range = 7
    }else{
        range = friends.length 
    }
    return res.render('friends.ejs' , { 
        title : 'Friends',
        all_friends : friends ,
        total_pending_requests : pending_requests, 
        pageNo : pageNo || 1,
        range : range,
        friends_length : friends.length 
    })
}
