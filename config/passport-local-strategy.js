const passport = require('passport');

const LocalStrategy = require('passport-local').Strategy;

const User = require('../models/user');
const { error } = require('console');


const { sessionStore } = require('./sessionStore');
const mongoose = require('mongoose');



passport.use(new LocalStrategy({   
        usernameField: 'email',
        passReqToCallback : true 
    },
    async function(req,email, password, done){ 

        try {
            const user = await User.findOne({ email: email });
    
            if (!user || user.password !== password) {
                req.flash('error', 'Invalid Username/Password');
                return done(null, false);
            }
    
            
            const client = mongoose.connection.getClient();
            const sessionsCollection = client.db().collection('sessions');
            

            const sessions = await sessionsCollection.find({}).toArray();
            const userSessions = sessions.filter(session => {
                const sessionData = JSON.parse(session.session);
                return sessionData.passport && sessionData.passport.user === user.id;
            });
            const deletePromises = userSessions.map(session => 
                sessionsCollection.deleteOne({ _id: session._id })  
                
            );

            
            
            




            
    
            return done(null, user);
        } catch (err) {
            req.flash('error', err);
            return done(err);
        }
    }


));



passport.serializeUser(function(user, done){
    done(null, user.id); 
})



passport.deserializeUser(function(id, done){
    User.findById(id) 
    .then((user)=>{
        return done(null, user);
    })
    .catch((err)=>{
        
        return done(err);
    })
});




passport.checkAuthentication = function(req,res,next){
    if(req.isAuthenticated()){
        return next(); 
    }
    return res.redirect('/users/sign-in'); 
}

passport.setAuthenticatedUser = function(req , res , next){ 
    if(req.isAuthenticated()){
        res.locals.user = req.user; 
    }
    next();
}


module.exports = passport;