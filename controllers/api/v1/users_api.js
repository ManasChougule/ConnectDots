const User = require('../../../models/user');
const jwt = require('jsonwebtoken');
const env = require('../../../config/environment');
module.exports.createSession = async function(req, res){
    try {
        let user = await User.findOne({email:req.body.email});
        
        if(!user || user.password != req.body.password){

            return res.status(422).json({
                message : "Invalid Username or Password"
            });
        }
    
        return res.json(200,{
            message : "Sign in successful , here is your tokem , keep it safe!",
            data : {
                token : jwt.sign(user.toJSON() , env.jwt_secret_key , {expiresIn : '100000'})
            }
        });
    } catch (error) {
        
        
        console.log('error is',error)
        return res.status(500).json({
            message : "Internal Server Error"
        });
    }

};