const env = require('./environment');
const accountSid = env.twilio_sid;
const authToken = env.twilio_auth_token ;
const twilioPhoneNumber = env.twilio_phone_number;

const client = require('twilio')(accountSid, authToken);


const sendSMS = async (phoneNumber , message)=>{
    
    try{
        await client.messages
        .create({
            body: message,
            from: twilioPhoneNumber, 
            to: '' 
        })
        .then(message => console.log(message))
    }catch(err){
        console.log('error sending sms',err)
    }
}

module.exports = sendSMS

