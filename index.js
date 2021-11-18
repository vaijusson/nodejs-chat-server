const express = require('express');
const app = express();
const http = require('http').createServer(app);
const socketio = require('socket.io');
const io = socketio(http);
const cookieParser = require('cookie-parser');
const mongoDB = 'mongodb+srv://ckmobile:Hello123$@cluster0.lquhb.mongodb.net/chat-database?retryWrites=true&w=majority';
const mongoose = require('mongoose');
mongoose.connect(mongoDB, { useUnifiedTopology: true, useNewUrlParser: true }).then(()=>console.log('connected')).catch(err => console.log(err));
const PORT = process.env.PORT || 5000;
const {addUser, getUser, removeUser} = require('./helper');
const Room = require('./models/Room');
const Message = require('./models/Message');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');
const corsOptions = {
    origin: 'http://localhost:3000/',
    credentials: true,
    optionSuccessStatus:200
}
app.use(cors(corsOptions));
app.use(express.json({ extended: true}));
app.use(cookieParser());
app.use(authRoutes);

//set cookie
app.get('/set-cookies',(req,res) => {
    res.cookie('username','Tony');
    res.cookie('isAuthenticated', true, {httpOnly:true});
    //use {httpOnly:true} to get an attribute only via HTTP call
    //use {secure:true} to get only via https.
    //use {maxAge: <sometime>} to set cookie age.
    res.send('cookie is set.');
})

//read-cookie
app.get('/get-cookies',(req,res)=>{
    const cookies = req.cookies;
    console.log(cookies);
    res.json(cookies);
})

io.on('connection', (socket) => {
  //console.log(socket.id);
  Room.find().then(result => {
        console.log('output-rooms',result)
      socket.emit('output-rooms',result)
  })
  socket.on('create-room', name => {
      //console.log('Room name got is ', name)
      const room = new Room({name});
      room.save().then(result => io.emit('room-created', result))
  })
  socket.on('join',({name,room_id,user_id}) => {
      const {error,user} = addUser({
          socket_id:socket.id,
          name,
          room_id,
          user_id
      })
      socket.join(room_id);
      if (error) {
          console.log('join error', error);
      }
      else {
          console.log('join user',user);
      }
  })
  socket.on('sendMessage', (message,room_id,callback) => {
     const user = getUser(socket.id);
     console.log(user);
     const msgToStore = {
         name: user.name,
         user_id: user.user_id,
         room_id,
         text: message
     }
     console.log('message recieved: ', msgToStore);
     const msg = new Message(msgToStore);
     msg.save().then(result => {
         io.to(room_id).emit('message',result);
         callback();
     })
    //  io.to(room_id).emit('message',msgToStore);
    //  callback();
  })
  socket.on('get-messages-history', room_id => {
    Message.find({ room_id }).then(result => {
        socket.emit('output-messages', result)
    })
    })
  socket.on('disconnect', () => {
      const user = removeUser(socket.id);

  })
});

http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});