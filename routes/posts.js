const express = require('express');
const router = express.Router();
const passport = require('passport');


const postsController = require('../controllers/posts_controller');

// router.post('/create', passport.checkAuthetication , postsController.create);
router.post('/create', (req,res,next)=>{ 
    if(req.isAuthenticated()){
        return next(); 
    }
    return res.redirect('/users/sign-in'); 
} , postsController.create);

router.get('/destroy/:id' , (req,res,next)=>{ 
    if(req.isAuthenticated()){
        return next(); 
    }
    return res.redirect('/users/sign-in'); 
} , postsController.destroy);



module.exports = router;