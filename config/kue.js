const kue = require('kue');

const queue = kue.createQueue();

module.exports = queue; // queue is a group of similar jobs(emails , otps , notifications)
