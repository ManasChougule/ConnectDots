const express = require('express');
const router = express.Router();

const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const mongoose = require('mongoose');
const path = require('path')
const imagesController = require('../controllers/imagesController');

// Using existing mongoose connection
const conn = mongoose.connection;


// GridFS Storage
const storage = new GridFsStorage({
  db: conn,
  file: (req, file) => {
    {
        const originalName = file.originalname;
        const ext = path.extname(originalName);
        const base = path.basename(originalName, ext);
        const safeBase = base.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        const filename = `${Date.now()}_${safeBase}${ext}`;       // “162…_My_photo_1.png”
        return {
            filename,
            bucketName: 'uploads',
            metadata: {
                userId: req.user._id
            }
        };
    }
  }
});

const upload = multer({ storage });

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.redirect('/users/sign-in');
}

// Route to upload image using the controller
router.post('/uploadImage', upload.single('image'), imagesController.uploadImage);
router.get('/fetchImage/:filename',  imagesController.fetchImage);
router.delete('/delete/:id', imagesController.deleteImage);

module.exports = router;