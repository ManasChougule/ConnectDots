const passport = require('passport');
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;

const User = require('../models/user');
const env = require('./environment');

let opts = {
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: env.jwt_secret_key
}

console.log("JWT Secret:", env.jwt_secret_key);

passport.use(new JWTStrategy(opts, function(jwtPayLoad, done){
    User.findById(jwtPayLoad._id)
    .then((user)=>{
        if (user){
            console.log("User found:", user);
            return done(null, user);
        }else{
            console.log("User not found");
            return done(null, false);
        }
    })
    .catch((err)=>{
        
    })

}));

module.exports = passport;
