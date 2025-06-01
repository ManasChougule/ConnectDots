




const nodeMailer = require('../config/nodemailer');
const {getWiFiIPv4Address } = require('../helper')
// let wifiIP=getWiFiIPv4Address();
let wifiIP = process.env.WIFI_IP + ':' + process.env.SERVER_PORT;

exports.newPost = (post_content,user) => {
    let htmlString;
    let sub;  
    htmlString = nodeMailer.renderTemplate({ post_content:post_content , user_name:user.name }, '/posts/new_post.ejs');
    sub = "🎉 Congratulations! Your new post is now published and visible to the ConnectDots community. 😊!"

    nodeMailer.transporter.sendMail({ 
        from: 'manaschougule2019@gmail.com',
        to: user.email ,   
        subject: sub,
        html: htmlString
    }, (err, info) => {  
        if (err){  
            return;
        }
        return;
    });  
}

exports.newPostFromMyCloseFriend = (me,post_content,my_close_friend) => {
    let htmlString;
    let sub;  

    htmlString = nodeMailer.renderTemplate({ me:me, post_content:post_content, my_close_friend:my_close_friend }, '/posts/my_new_post_email_to_closeFriend.ejs');
    sub = "Your Close Friend just made a post, please have a look. 😊!"

    nodeMailer.transporter.sendMail({ 
        from: 'manaschougule2019@gmail.com',
        to: my_close_friend.email ,   
        subject: sub,
        html: htmlString
    }, (err, info) => {  
        if (err){  
            return;
        }
        return;
    });  
}

exports.newComment = (comment_content , object) => {
    let htmlString;
    let sub;  
    if(object.post){  
        htmlString = nodeMailer.renderTemplate({comment: object}, '/comments/new_comment.ejs');
        sub = "You Have Published A New Comment!"
    }else{
        htmlString = nodeMailer.renderTemplate({post: object , comment_content:comment_content }, '/posts/new_comment_on_post.ejs');
        sub = "New Comment Published On Your Post!"
    }

    nodeMailer.transporter.sendMail({ 
        from: 'manaschougule2019@gmail.com',
        to: object.user.email ,   
        subject: sub,
        html: htmlString
    }, (err, info) => {  
        if (err){
            return;
        }
        return;
    });  
}

exports.resetPasswordEmail = (user,token) => {
    user = {email: user.email ,name: user.name}; 
    let htmlString = nodeMailer.renderTemplate({user: user,token:token,wifiIP:wifiIP}, '/passwords/reset_password_email.ejs');
    nodeMailer.transporter.sendMail({
       from: 'manaschougule2019@gmail.com',
       to: user.email,        
       subject:"Please reset your password",
        html: htmlString
    }, (err, info) => {  
        if (err){
            return;
        }
        return;
    });
}

exports.passwordResetSuccessfullyEmail = (user) => { 
    var user = {email: user.email ,name: user.name}; 
    let htmlString = nodeMailer.renderTemplate({user: user}, '/passwords/reset_password_successfully_email.ejs');
    nodeMailer.transporter.sendMail({
       from: 'manaschougule2019@gmail.com',
       to: user.email,        
       subject:"Your password was reset",
        html: htmlString
    }, (err, info) => {  
        if (err){
            
            return;
        }
        return;
    });
}
           
exports.addFriendEmail = (from_user , to_user , token)=>{ 
    var from_user = {email: from_user.email ,name: from_user.name,
        toString: function () {
            return `${this.email}`;
          },};
    var to_user = {email: to_user.email ,name: to_user.name,      
        toString: function () {     
            return `${this.email}`;
          },};    
    let htmlString = nodeMailer.renderTemplate({from_user: from_user , to_user: to_user ,token:token,wifiIP:wifiIP}, '/friends/add_friend_email.ejs');
    nodeMailer.transporter.sendMail({
        from: from_user.email, 
        to: to_user.email,        
        subject:"I want to connect",
        html: htmlString
     }, (err, info) => {  
         if (err){
             
             return;
         }
         return;
     });
}

exports.verifyEmailAddress = (user,token) => { 
    var user = {email: user.email ,name: user.name}; 
    let htmlString = nodeMailer.renderTemplate({user:user, token:token,wifiIP:wifiIP}, '/emails/verify_email_address.ejs');
    nodeMailer.transporter.sendMail({
       from: 'manaschougule2019@gmail.com',
       to: user.email,        
       subject:"ConnectDots -Email Verification",
        html: htmlString
    }, (err, info) => {  
        if (err){
            console.log('some error occured while sending verification email',err)
            return;
        }
        return;
    });
}

exports.accountActivated = (user) => { 
    var user = {email: user.email ,name: user.name}; 
    let htmlString = nodeMailer.renderTemplate({user:user,wifiIP:wifiIP}, '/emails/email_verified_successfully.ejs');
    nodeMailer.transporter.sendMail({
    from: 'manaschougule2019@gmail.com',
    to: user.email,        
    subject:"ConnectDots - Account Activated",
        html: htmlString
    }, (err, info) => {  
        if (err){
            
            return;
        }
        return;
    });
}