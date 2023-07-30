import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { ExpressPeerServer } from 'peer';
import url from 'node:url';
import controllerApplier from './lib/middlewares/controllerApplier.js';
import postScriptApplier from './lib/middlewares/postScriptApplier.js';
import scriptApplier from './lib/middlewares/scriptApplier.js';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv-flow';

dotenv.config();

const port = 8000;
const app = express();
const server = createServer(app);
const io = new Server(server);
const peer = ExpressPeerServer(server);

app.use('/peerjs', peer);
app.use(cookieParser());

app.set('views', './src/views');
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/page/:controller/:action?/:id?', controllerApplier);
app.use('/post/:scriptName', postScriptApplier);
app.use('/script/:scriptName', scriptApplier);

app.get('/', (req, res) => res.redirect('/page/homepage'));

//app.get('/:room', (req, res) => res.render('index', { RoomId: req.params.room }));

io.on("connection", socket =>
{
    socket.on("newUser", (id, room) =>
    {
        socket.join(room);
        socket.broadcast.to(room).emit('userJoined', id);
        socket.on('disconnect', () => socket.broadcast.to(room).emit('userDisconnect', id) );
    });
});

let [socketioUpgradeListener ] = server.listeners('upgrade').slice(0);
server.removeAllListeners('upgrade');
server.on('upgrade', (req, socket, head) => {
    const pathname = url.parse(req.url ?? '').pathname;
    if (pathname == '/socket.io/')
      socketioUpgradeListener(req, socket, head);
    else
      socket.destroy();
  });

server.listen(port, () => console.log('Signum videochat server running on port ' + port));