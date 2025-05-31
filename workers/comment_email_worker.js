const queue = require('../config/kue');


const commentsMailer = require('../mailers/comments_mailer');        








queue.process('emails', function(job, done) {
    if (job.data.type === 'comment') {
        commentsMailer.newComment(job.data.comment, job.data.post);
    } else if (job.data.type === 'post') {
        commentsMailer.newPostFromMyCloseFriend(job.data.me,job.data.post,job.data.my_close_friend);
    }
    done();
});


