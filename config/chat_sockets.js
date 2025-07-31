
const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const userSockets = {};  
const env = require('./environment');
module.exports.chatSockets = function(socketServer) {
    // const io = require('socket.io')(socketServer, {    
    //     // cors: {
    //     //     origin: 'http://13.204.64.57', // this will make request to 5000 port
    //     //     methods: ["GET", "POST"],
    //     //     allowedHeaders: ['Content-Type'],
    //     //     credentials: true
    //     // }
    //     cors: {
    //         origin: '*'
    //     }
    // });

    const io = require('socket.io')(socketServer, {
    	cors: {
        	origin: env.base_url,   
        	methods: ["GET", "POST"],
        	credentials: true
    	},
    	path: "/socket.io" // VERY IMPORTANT when using reverse proxy like Nginx
    });


    io.on('connection', function(socket) {
        socket.on('disconnect', function() {
            
        });
        socket.on('reconnect', function() {
            
        });

        socket.on('join_room', function(data) {      
            socket.join(data.chatroom);
            io.in(data.chatroom).emit('user_joined', data);
        });


        socket.on('join_personal_room', function(data) {
            userSockets[data.user_email] = socket;
            socket.join(data.chatroom);
            io.in(data.chatroom).emit('user_joined2', data);
        });

        socket.on('send_message', async function(data) {
            const newMessage = new Message({
                user_email: data.user_email,
                message: data.message,
                to_user: data.to_user    
            });

            try {
                await newMessage.save();
            } catch (error) {
                console.error('Error saving message to MongoDB:', error);
            }
            io.in(data.chatroom).emit('receive_message', data);
        });

        socket.on('send_message2', async function(data) {
            
            const newMessage = new Message({
                user_email: data.user_email,
                message: data.message,
                to_user: data.to_user   
            });

            try {
                await newMessage.save();
            } catch (error) {
                console.error('Error saving message to MongoDB:', error);
            }

            if(userSockets[data.user_email]){
                userSockets[data.user_email].emit('receive_message2', data);
            }
            if(userSockets[data.to_user]){
                userSockets[data.to_user].emit('receive_message2', data);
            }

        });

        router.get('/api/getPreviousMessages', async (req, res) => {
            try {
                const messages = await Message.find().exec();
                res.json({ messages });
            } catch (error) {
                console.error('Error fetching previous messages:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    });
};





