const express = require('express');
const { use } = require('./routes/usersRoute');
const mailRouter = require('./routes/mail');

const dotenv = require('dotenv').config();
const httpPort = process.env.HTTPPORT || 5000;
const httpsPort = process.env.HTTPSPORT || 5443;
const { errorHandler } = require('./middleware/errorMiddleware');
const colors = require('colors');
const dbConnect = require('./config/db')
const cors = require('cors');
const helmet = require('helmet');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// server https
const fs = require('fs');
const https = require('https');

const options = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
};

module.exports = io;

// Créer un espace de noms pour les users
const userIo = io.of('/users');

// Gérer les connexions dans l'espace de noms users
userIo.on('connection', socket => {
  console.log('Un client est connecté à l\'espace chatRooms.');

  socket.on('new_user_created', (user) => {
    console.log(user);
  });

  socket.on('disconnect', () => {
    console.log('Un client est déconnecté de l\'espace chatRooms.');
  });
});

// Créer un espace de noms pour les messages
const messageIo = io.of('/messages');

messageIo.on('connection', socket => {
  console.log('Un client est connecté.');

  socket.on('send_message', (msg) => {
    console.log(msg);
  })

  socket.on('disconnect', () => {
    console.log('Un client est déconnecté.');
  })
});

// Créer un espace de noms pour les chatRooms
const chatRoomIo = io.of('/chatRooms');

// Gérer les connexions dans l'espace de noms chatRooms
chatRoomIo.on('connection', socket => {
  console.log('Un client est connecté à l\'espace chatRooms.');

  socket.on('new_chatRoom_created', (chatRoom) => {
    console.log(chatRoom);
  });

  socket.on('disconnect', () => {
    console.log('Un client est déconnecté de l\'espace chatRooms.');
  });
});


dbConnect();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "https://a596-2a02-8428-eb8a-e101-15d-25ec-cfaa-a750.ngrok-free.app, http://localhost:9000"); // Remplacez l'URL par l'adresse IP de ngrok pour votre application frontale
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });


app.use('/api/mail', mailRouter);
app.use('/api/users', require('./routes/usersRoute'));
app.use('/api/messages', require('./routes/messagesRoute'));
app.use('/api/chatRooms', require('./routes/chatRoomsRoute'));


app.use(errorHandler)
// app.listen(port,()=>{
//     console.log(`server started on port ${port}`);
// });

// Code pour démarrer le serveur http
http.listen(httpPort, () => {
  console.log(`Serveur HTTP démarré sur le port ${httpPort}`);
});

// // Code pour démarrer le serveur https
// https.createServer(options, app).listen(httpsPort, () => {
//     console.log(`Serveur HTTPS démarré sur le port ${httpsPort}`);
// });

// Code pour démarrer le serveur https avec ngrok URL
const ngrok = require('ngrok');
const ngrokPort = process.env.NGROK_PORT || httpsPort;

(async function () {
  const url = await ngrok.connect({ port: ngrokPort });
  console.log(`Serveur HTTPS démarré sur ${url}`);
  https.createServer(options, app).listen(ngrokPort, () => {
    console.log(`Ngrok forwarding HTTPS sur ${url} -> http://localhost:${ngrokPort}`);
  });
})();