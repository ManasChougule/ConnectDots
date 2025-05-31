const express = require('express');
                     
const router = express.Router();
const friendsController = require('../controllers/friends_controller');


router.get('/add-friend', friendsController.addFriend);

router.get('/add-friend-response', friendsController.addFriendResponse);

router.get('/close-friends/',friendsController.closeFriends);  
router.get('/add-close-friend/',friendsController.addOrRemoveCloseFriend);

router.get('/allFriends', friendsController.displayAllFriends);

module.exports = router;               