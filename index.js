const express = require('express');
const { engine } = require('express-handlebars');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { maxHttpBufferSize: 1e8 });
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const messages = require('./model/Message')
const fs = require('fs')
const md5 = require('md5')
const jwt_decode = require('jwt-decode');
const User = require('./model/User')
const getRoute = require('./routes/get');
const authRoute = require('./routes/apiUser');

app.engine('.hbs', engine({extname: '.hbs'}));
app.set('view engine', '.hbs');

dotenv.config()

app.use('/public', express.static('public'))


io.on('connection', async (socket) => {
  socket.on('userData', async (token) => {
    let decoded = jwt_decode(token);
    const user = await User.findOne({ _id: decoded._id });
    io.emit('userData', {name: user.name, avatar: user.avatar})
  })
  socket.on('chat message', async (msg) => {
    try
    {
      let token = msg.author
      let decoded = jwt_decode(token);
      let userFind = await User.findOne({ _id: decoded._id });
      let userData = {'_id': mongoose.Types.ObjectId(userFind._id), 'name': userFind.name, 'avatar': userFind.avatar}
      var newShit = new Array()
      for (let i = 0; i < msg.images.length; i ++)
      {
        let image = msg.images[i]
        let name = md5(image)
        fs.writeFile(`./public/uploads/${name}.jpg`, image, 'binary', function(err) {})
        newShit.push(`../public/uploads/${name}.jpg`)
      }
      const message = new messages({
        id: (await messages.find({}).lean()).length,
        msg: msg.message,
        images: newShit,
        author: userData,
        reply: msg.replyObj,
      });
      await message.save()
      
      io.emit('message callback', message); 
    } 
    catch(e)
    {
      console.log(e)
    }
  });
  socket.on('lastMessages', async (count) => {
    const list = await (await messages.find().sort({ _id: -1 }).limit(count).lean()).reverse()
    io.emit('lastMessages callback', list); 
  });
  socket.on('loadMessages', async (startid, lastid) => {
    const list = (await messages.find()
      .limit(lastid)
      .skip(startid)
      .lean()).reverse()

    io.emit('loadMessages callback', list); 
  });
});

async function start () {
  try {
    await mongoose.connect(
      process.env.TOKEN,
      {
      useNewUrlParser: true
      }
    )
    server.listen(3000, () => {
      console.log('listening on http://127.0.0.1:3000/');
    });   
    } catch (e) {
      console.log(e)
  }
}

app.use('/', getRoute);
app.use('/api/user', authRoute);

start()