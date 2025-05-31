const { GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const conn = mongoose.connection;
const { Types } = require('mongoose');
const ObjectId = Types.ObjectId;

module.exports.uploadImage = async function (req, res) { 
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.status(201).json({
      message: 'Image uploaded successfully',
      file: req.file
    });
  } catch (error) {
    res.status(500).json({
      message: '4444Failed to upload image',
      error: error.message
    });
  }
};


module.exports.fetchImage = async function (req, res) {
  try {
    const bucket = new GridFSBucket(conn.db, {
      bucketName: process.env.GFS_BUCKET || 'uploads'
    });

    const files = await bucket.find({ filename: req.params.filename }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    res.set('Content-Type', files[0].contentType || 'image/jpeg');
    bucket.openDownloadStreamByName(req.params.filename).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching image', error: err.message });
  }
};

module.exports.deleteImage = async function (req, res) {
  try {
    const bucket = new GridFSBucket(conn.db, { bucketName: 'uploads' });

    const fileId = new ObjectId(req.params.id);

    const file = await conn.db.collection('uploads.files').findOne({ _id: fileId });
    if (!file) {
      return res.status(404).json({ message: 'Image not found with given ID' });
    }

    // First, deleting file chunks and file entry
    await bucket.delete(fileId);
    return res.status(200).json({ message: 'Image deleted successfully', fileId: fileId });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting image', error: error.message });
  }
}
