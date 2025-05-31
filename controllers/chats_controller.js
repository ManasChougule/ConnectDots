const Chats = require('../models/message');
const User = require('../models/user');


module.exports.getPreviousMessages =  async function(req,res){ 
   
    try {
        
        var profile_user = undefined;
        var messages;
        var size=0;
        var all_messages = undefined;
        if(req.params.to_user!='null'){
            messages =  new Array(10);
            size=10;
            profile_user =  await User.findOne({email:req.params.to_user});
            
            all_messages = await Chats.find({ 
                $or: [
                    { user_email: req.user.email, to_user: profile_user.email },
                    { user_email: profile_user.email, to_user: req.user.email }
                ]
            });  

            
            
            
            
            


        }else{
            messages =  new Array(20);
            size=20;
            all_messages = await Chats.find({to_user:null}).exec(); 
        }


        
        let key, objectLength = 0;
        objectLength=Object.keys(all_messages).length;
        
        if((objectLength-size)>0){
            
            for(let i=0;i<objectLength-size;i++){
                await Chats.deleteOne(all_messages[i]);
                
                
            }
            for(let i = 0; i<size;i++){
                messages[i] = all_messages[i+(objectLength-size)];
            }
        }else{
            
            for(let i = 0; i<objectLength;i++){
                messages[i] = all_messages[i];
                
            }   
        }
        
        res.json({ messages });
       
    } catch (error) {
        console.error('Error fetching previous messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}