const socketIOClient = require('socket.io-client');
const io = socketIOClient('http://localhost:5000');

module.exports = io;