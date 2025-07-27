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
            pass: 'lrdz qvjx faky ujtd'//'key generated'
        },
    },
    google_client_id: '',
    google_client_secret: '',
    google_callback_url: "",
    jwt_secret_key: 'connectdots_jwt_secret',
    morgan: {
        mode: 'combined',
        options: { stream: accessLogStream }
    },
    mongo_port: 27017,
    server_port: 8080,
    chat_port: 5000,
    wifi_ip: 'localhost', 
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
//    server_port: 80,
    chat_port: process.env.CHAT_PORT,
    //wifi_ip: process.env.WIFI_IP
	wifi_ip: "connectdots.fun"
}

module.exports = process.env.CONNECT_DOTS_ENVIRONMENT == "development" ? development : production;
