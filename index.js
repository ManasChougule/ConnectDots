const express = require('express');
const { route } = require('./routes');
const app = express();
const CORS = require('cors');
// const port = 8000;
app.use(CORS({
    origin: '*'
}));
require('./config/view-helpers')(app);

require('dotenv').config();   // env file is accessed here 

const { sessionMiddleware } = require('./config/sessionStore');
// mongoose & user schema
const db = require('./config/mongoose');

// using express-session , it is used to encrypt the user id and put inside the cookie while serializing
const session = require('express-session');
const passport = require('passport');
const passportLocal = require('./config/passport-local-strategy');
const passportJWT = require('./config/passport-jwt-strategy');
const passportGoogle = require('./config/passport-google-oauth2-strategy');


// require connect-flash middleware & custome middleware
const flash = require('connect-flash');
const customMware = require('./config/middleware');


// cookie-parser
const cookieParser = require('cookie-parser');

// JSON-parser
app.use(express.json());
// app.use(express.urlencoded());

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


// setup the chat server to be used with socket.io
const chatServer = require('http').Server(app);
const chatSockets = require('./config/chat_sockets').chatSockets(chatServer);
//chatServer.listen(5000);


//using static files & environment
const env = require('./config/environment');
//setting asset path to load css files
app.use(express.static(env.asset_path));

// morgan
const logger = require('morgan');
app.use(logger(env.morgan.mode, env.morgan.options));

//making upoloads path available to the browser
app.use('/uploads', express.static(__dirname + '/uploads'))

//extract the styles from subpages(ejs files) & put them into layout.ejs at specified locationseet
app.set('layout extractStyles', true);
app.set('layout extractScripts', true);

// setting up the view engine
app.set('view engine', 'ejs');
app.set('views', './views');


//using express layouts
const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);



app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

app.use(passport.setAuthenticatedUser);

// used connect-flash middleware & custome middleware
app.use(flash());
app.use(customMware.setFlash);

// using the route
app.use('/', (req, res, next) => {
    console.log(`method: ${req.method} time : ${req.url}`);
    res.locals.req = req;
    next();
}, require('./routes'));


const port = env.server_port;
const chat_port = env.chat_port;
app.listen(port, function (err) {
    chatServer.listen(chat_port);
    console.log("Listening on port", port)
})
