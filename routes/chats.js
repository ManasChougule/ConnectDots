
const express = require('express');
const router = express.Router();
const chatsController = require('../controllers/chats_controller');
router.get('/getPreviousMessages/:to_user/', chatsController.getPreviousMessages);  
// to_user is the email of to_user i.e user to whome personal chat is sent
 

module.exports = router;   