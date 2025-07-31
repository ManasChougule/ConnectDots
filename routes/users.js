const express = require('express');
const router = express.Router(); // this const router is limited to this module only
const usersController = require('../controllers/users_controller');
const passport = require('passport');
  
// Define middleware to check if the user is logged in
function requireLogin(req, res, next) {
    if (req.user && req.user._id) {
        return next();
    } else {     
        return res.redirect('/');
    }
}

// router.get('/profile'  ,  usersController.profile);
// router.get('/profile' , passport.checkAuthentication ,  usersController.profile);  // error: route.get() requires a callback function but got a [object undefined]
router.get('/profile/:id' , (req,res,next)=>{  
    if(req.isAuthenticated()){  //  to access the profile user need to sign in first 
        return next(); 
    }
    return res.redirect('/users/sign-in'); 
},  usersController.profile);

router.post('/update/:id' , (req,res,next)=>{  // now to access the profile user need to sign in first
    if(req.isAuthenticated()){
        return next(); 
    }
    return res.redirect('/users/sign-in'); 
},  usersController.update);

router.get('/sign-up' , usersController.signUp);

router.get('/sign-in' , usersController.signIn);

router.post('/create' , usersController.create);

// router.post('/create-session' , passport.checkAuthentication  , usersController.createSession);
router.post('/create-session' , 
passport.authenticate(  // passport will authenticate(checks credentials :- email & password) user when user submit sign in form if success then req.isAuthenticated() will become true
    'local' , 
    {failureRedirect : "/users/sign-in"}
),usersController.createSession);  


router.get('/sign-out' , usersController.destroySession);
//oauth2 :-
router.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']})); // u can this like when user clicks on google sign in this rout gets opend 
router.get('/auth/google/callback', passport.authenticate('google', {failureRedirect: '/users/sign-in'}), usersController.createSession); // when google verifies the user then it sends user's data to browsser on this callback route




//forgot password
router.get('/forgot-password' , usersController.forgotPass);
router.post('/verify-email' , usersController.verifyEmail);
router.get('/reset-password/:user_name/:user_email/:token' , usersController.resetPass);
router.post('/change-password/:user_email/:token' , usersController.changePass);


// verify or confirm email while registration
router.get('/verify-my-email-address/:user_email/:token',usersController.verifyMyEmailAddress);

router.get('/send-verification-email/:user_email/',usersController.sendVerificationEmail);

//block user
router.get('/blockUser/',usersController.blockUser)

// display all users
router.use(requireLogin);
router.get('/allUsers' , usersController.displayAllUsers);

// display all notifications related to post/comments liked
router.get('/allNotifications' , usersController.displayAllNotifications);
router.get('/pending-friend-requests' , usersController.friendRequests);

module.exports = router;    
