
const session = require('express-session');
const MongoStore = require('connect-mongo');
const env = require('./environment'); 

const sessionStore = new MongoStore({
    mongoUrl: `mongodb://127.0.0.1:${env.mongo_port}/${env.db}`,  
    autoRemove: 'disabled',
    ttl: 24 * 60 * 60  
}, function (err) {
    console.log(err || 'connect-mongodb setup ok');
});

const sessionMiddleware = session({
    name: 'ConnectDots',
    secret: env.jwt_secret_key,
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 1000 * 60 * 100 * 24 
    },
    store: sessionStore
});

module.exports = {
    sessionMiddleware,
    sessionStore
};


