const mongoose = require('mongoose');
const env = require('./environment');
  
mongoose.connect(`mongodb://127.0.0.1:${env.mongo_port}/${env.db}`);  

const db = mongoose.connection;


db.on('error' , console.log.bind(console , 'Error while connecting to MongoDB'));

db.once('open' , function(){
    console.log(`Successfully connected to database :: MongoDB on port: ${env.mongo_port}`);
})

module.exports = db;