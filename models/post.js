const mongoose = require('mongoose');


const postSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    user: {
        type:  mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true
    },
    comments:[
        {
            type:  mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        }   
    ],
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Like'
        }
    ],
    isFeatured: {
        type: Boolean,
        default: false // Default to false, meaning the post is not featured unless set otherwise
    },
    imageFileName: {
        type: String,
        default: "",
    }

},{
    timestamps: true  // automatically creates and updates the createdAt field when saving a new post.
});  

const Post = mongoose.model('Post', postSchema);
module.exports = Post;