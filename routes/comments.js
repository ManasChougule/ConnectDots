const express = require('express');
const router = express.Router();
const passport = require('passport');


const commentsController = require('../controllers/comments_controller');

// router.post('/create', passport.checkAuthetication , commentsController.create);
router.post('/create', (req,res,next)=>{ 
    if(req.isAuthenticated()){
        return next(); 
    }
    return res.redirect('/users/sign-in'); 
} , commentsController.create);


router.get('/destroy/:id', (req,res,next)=>{ 
    if(req.isAuthenticated()){
        return next(); 
    }
    return res.redirect('/users/sign-in'); 
} , commentsController.destroy);

router.get('/fetchNext15Comments/:postId', (req,res,next)=>{ 
    if(req.isAuthenticated()){
        return next(); 
    }
    return res.redirect('/users/sign-in'); 
} , commentsController.fetchNext15Comments);

  
module.exports = router;