const fs = require('fs');
const rfs = require('rotating-file-stream');
const path = require('path');
require('dotenv').config();

const logDirectory = path.join(__dirname, '../production_logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

const accessLogStream = rfs.createStream('access.log', {
    interval: '1d',
    path: logDirectory
});


const development = {
    name: 'development',
    asset_path: './assets',
    session_cookie_key: 'blahsomething',
    db: 'db_name',
    smtp: {
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'manaschougule2019@gmail.com',
            pass: ''
        },
    },
    google_client_id: process.env.CONNECT_DOTS_GOOGLE_CLIENT_ID,
    google_client_secret: process.env.CONNECT_DOTS_GOOGLE_CLIENT_SECRET,
    google_callback_url: process.env.CONNECT_DOTS_GOOGLE_CALLBACK_URL,
    jwt_secret_key: 'connectdots_jwt_secret',
    morgan: {
        mode: 'combined',
        options: { stream: accessLogStream }
    },
    mongo_port: 27017,
    server_port: 8080,
    chat_port: 5000,
    base_url: 'http://localhost:8080', 
    sender_email:''
}



const production = {
    name: 'production',
    asset_path: process.env.CONNECT_DOTS_ASSET_PATH,
    session_cookie_key: process.env.CONNECT_DOTS_SESSION_COOKIE_KEY,
    db: process.env.CONNECT_DOTS_DB,
    smtp: {
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.CONNECT_DOTS_GMAIL_USERNAME,
            pass: process.env.CONNECT_DOTS_GMAIL_PASSWORD
        },
    },
    google_client_id: process.env.CONNECT_DOTS_GOOGLE_CLIENT_ID,
    google_client_secret: process.env.CONNECT_DOTS_GOOGLE_CLIENT_SECRET,
    google_callback_url: process.env.CONNECT_DOTS_GOOGLE_CALLBACK_URL,
    jwt_secret_key: process.env.CONNECT_DOTS_JWT_SECRET,
    morgan: {
        mode: 'combined',
        options: { stream: accessLogStream }
    },
    twilio_sid: process.env.TWILIO_ACCOUNT_SID,
    twilio_auth_token: process.env.TWILIO_AUTH_TOKEN,
    twilio_phone_number: process.env.TWILIO_PHONE_NUMBER,
    mongo_port: process.env.CONNECT_DOTS_MONGO_PORT, 
	server_port: process.env.SERVER_PORT,
    chat_port: process.env.CHAT_PORT,
	base_url: process.env.BASE_URL,
    sender_email:process.env.SENDER_EMAIL
}



module.exports = process.env.CONNECT_DOTS_ENVIRONMENT == "development" ? development : production;
