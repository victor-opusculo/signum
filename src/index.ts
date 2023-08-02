import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { ExpressPeerServer } from 'peer';
import url from 'node:url';
import controllerApplier from './lib/middlewares/controllerApplier.js';
import postScriptApplier from './lib/middlewares/postScriptApplier.js';
import scriptApplier from './lib/middlewares/scriptApplier.js';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv-flow';
import { verifyTokens } from './lib/helpers/verifyTokensForSocket.js';

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

const roomsData:
{
    id: string,
    interpreterId: { peerId: string, signumId: number }|null,
    customerId: { peerId: string, signumId: number }|null,
    guests: string[],
    beginTime: Date|undefined,
    endTime?: Date|undefined
}[] = [];

function createRoomData(roomId: string, customerId: number|null, interpreterId: number|null, peerId: string)
{
    const existent = roomsData.find( r => r.id === roomId );

    if (existent)
    {
        existent.customerId ??= customerId ? { peerId, signumId: customerId } : null;
        existent.interpreterId ??= interpreterId ? { peerId, signumId: interpreterId } : null;

        if (!customerId && !interpreterId)
            existent.guests.push(peerId);
    }
    else
    {
        roomsData.push(
        {
            id: roomId,
            interpreterId: interpreterId ? { peerId, signumId: interpreterId } : null,
            customerId: customerId ? { peerId, signumId: customerId } : null,
            guests: [],
            beginTime: new Date(),
            endTime: undefined
        });
    }
}

const interpretersWaitingIds: string[] = [];
const customersWaitingRoomIds: string[] = [];

function onUserDisconnect(socket: Socket, roomId: string, type: string, signumId: number|null, peerId: string)
{
    socket.broadcast.to(roomId).emit('userDisconnect', type, signumId, peerId);

    if (type === 'customer')
    {
        io.in(roomId).disconnectSockets();
    }

    let room = io.sockets.adapter.rooms.get(roomId);
    if (!room)
    {
        const room = roomsData.find(r => r.id === roomId);
        if (room)
        {
            room.endTime = new Date();
            console.log(room);
        }
    }
}

io.on("connection", socket =>
{
    socket.on("interpreterWaiting", () => 
    {
        if (customersWaitingRoomIds.length > 0)
        {
            socket.emit('customerCalled', customersWaitingRoomIds.shift());
        }
        else
        {
            interpretersWaitingIds.push(socket.id);
            console.log('interpreter waiting', socket.id);
            socket.on('disconnect', () => interpretersWaitingIds.splice(interpretersWaitingIds.indexOf(socket.id), 1));
        }
    });

    socket.on("customerWaiting", roomId =>
    {
        if (interpretersWaitingIds.length > 0)
        {
            const randomIndex = Math.floor(Math.random() * (interpretersWaitingIds.length - 0.5));
            const randomIntr = interpretersWaitingIds[randomIndex];
            socket.to(randomIntr).emit('customerCalled', roomId);
            interpretersWaitingIds.splice(randomIndex, 1);
        }
        else
        {
            customersWaitingRoomIds.push(roomId);
            socket.on('disconnect', () => 
            {
                const index = customersWaitingRoomIds.indexOf(roomId);
                if (index != -1)
                  customersWaitingRoomIds.splice(index, 1);
            })
        }
    })

    socket.on("newUser", async (type, signumId, token, peerId, roomId) =>
    {
        if (!io.sockets.adapter.rooms.has(roomId) && type !== 'interpreter' && type !== 'customer')
            socket.disconnect();
        else if (!io.sockets.adapter.rooms.has(roomId) && (type === 'interpreter' || type === 'customer'))
        {
            if (await verifyTokens(type, signumId, token))
            {
                createRoomData(roomId, type === 'customer' ? signumId : null, type === 'interpreter' ? signumId : null, peerId);
                socket.join(roomId);
                socket.broadcast.to(roomId).emit('userJoined', type, signumId, peerId);
                socket.on('disconnect', () => onUserDisconnect(socket, roomId, type, signumId, peerId) );
            }
            else
                socket.disconnect();
        }
        else if (io.sockets.adapter.rooms.has(roomId))
        {
            if (await verifyTokens(type, signumId, token))
            {
                createRoomData(roomId, type === 'customer' ? signumId : null, type === 'interpreter' ? signumId : null, peerId);
                socket.join(roomId);
                socket.broadcast.to(roomId).emit('userJoined', type, signumId, peerId);
                socket.on('disconnect', () => onUserDisconnect(socket, roomId, type, signumId, peerId) );
            }
            else
            {
                createRoomData(roomId, null, null, peerId);
                socket.join(roomId);
                socket.broadcast.to(roomId).emit('userJoined', 'guest', null, peerId);
                socket.on('disconnect', () => onUserDisconnect(socket, roomId, type, signumId, peerId) );
            }
        }
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