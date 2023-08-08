import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { saveTranslationSessionData, type SessionData } from './lib/helpers/sessionDataSaver.js';
import { ExpressPeerServer } from 'peer';
import url from 'node:url';
import controllerApplier from './lib/middlewares/controllerApplier.js';
import postScriptApplier from './lib/middlewares/postScriptApplier.js';
import scriptApplier from './lib/middlewares/scriptApplier.js';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv-flow';
import { verifyTokens } from './lib/helpers/verifyTokensForSocket.js';
import { register } from './lib/helpers/statisticsManager.js';

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

const roomsData: SessionData[] = [];

function createRoomData(roomId: string, customerId: number|null, interpreterId: number|null, peerId: string, createdByGuest: boolean)
{
    const existent = roomsData.find( r => r.id === roomId );

    if (existent)
    {
        existent.customerId ??= customerId ? { peerId, signumId: customerId } : null;

        if (!existent.interpreterId.find( intr => intr.signumId === interpreterId ) && interpreterId)
            existent.interpreterId.push({ peerId, signumId: interpreterId });

        if (!existent.interpretersHistory.find( intr => intr.signumId === interpreterId ) && interpreterId)
            existent.interpretersHistory.push({ peerId, signumId: interpreterId });

        if (interpreterId && !existent.beginTime)
            existent.beginTime = new Date();

        if (!customerId && !interpreterId)
            existent.guests.push(peerId);
    }
    else
    {
        roomsData.push(
        {
            id: roomId,
            interpreterId: interpreterId ? [{ peerId, signumId: interpreterId }] : [],
            interpretersHistory: interpreterId ? [{ peerId, signumId: interpreterId }] : [],
            customerId: customerId ? { peerId: createdByGuest ? null : peerId, signumId: customerId } : null,
            guests: createdByGuest ? [ peerId ] : [],
            beginTime: new Date(),
            endTime: undefined,
            createdByGuest: createdByGuest
        });
    }
}

const interpretersWaitingIds: string[] = [];
const customersWaitingRoomIds: string[] = [];

function onUserDisconnect(socket: Socket, roomId: string, type: string, signumId: number|null, peerId: string, screenName: string)
{
    socket.broadcast.to(roomId).emit('userDisconnect', type, signumId, peerId, screenName);

    if (type === 'interpreter')
    {
        const room = roomsData.find(r => r.id === roomId);
        if (room)
        {
            const intrIndex = room.interpreterId.findIndex( intr => intr.signumId === signumId );
            if (intrIndex >= 0) 
                room.interpreterId.splice(intrIndex, 1);

            if (room.interpreterId.length < 1)
            {
                room.endTime = new Date();
                saveTranslationSessionData(room)
                .then(sessId => socket.broadcast.to(roomId).emit('sessionSurvey', sessId))
                .finally(() => 
                {
                    room.beginTime = undefined;
                    room.interpreterId = [];
                }).catch(console.log);
            }
        }
    }
    //    io.in(roomId).disconnectSockets();

    let room = io.sockets.adapter.rooms.get(roomId);
    if (!room)
    {
        const room = roomsData.find(r => r.id === roomId);
        if (room)
            roomsData.splice(roomsData.indexOf(room), 1);
    }
}

function onNewChatMessage(socket: Socket, roomId: string, screenName: string, message: string, datetimeUTC: string)
{
    socket.broadcast.to(roomId).emit('chatMessageReceived', screenName, message, datetimeUTC);
}

function onScreenNameChange(socket: Socket, screenNameRef: { current: string }, videoDivId: string, roomId: string, oldName: string, newName: string)
{
    screenNameRef.current = newName;
    socket.broadcast.to(roomId).emit('screenNameChanged', videoDivId, oldName, newName);
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

    socket.on("newUser", async (type, signumId, token, peerId, roomId, screenName, videoDivId, customerIdRelated) =>
    {
        let screenNameRef = { current: screenName };
        if (!io.sockets.adapter.rooms.has(roomId) && type !== 'interpreter' && type !== 'customer' && !customerIdRelated)
            socket.disconnect();
        else if (!io.sockets.adapter.rooms.has(roomId) && (type === 'interpreter' || type === 'customer' || customerIdRelated))
        {
            if (await verifyTokens(type, signumId, token) || customerIdRelated)
            {
                createRoomData(roomId, type === 'customer' ? signumId : (customerIdRelated ? customerIdRelated : null), type === 'interpreter' ? signumId : null, peerId, Boolean(customerIdRelated));
                socket.join(roomId);
                socket.broadcast.to(roomId).emit('userJoined', type, signumId, peerId, screenNameRef.current, videoDivId );
                socket.on('disconnect', () => onUserDisconnect(socket, roomId, type, signumId, peerId, screenNameRef.current ) );
                socket.on('screenNameChange', (oldName, newName) => onScreenNameChange(socket, screenNameRef, videoDivId, roomId, oldName, newName)); 
                socket.on('newChatMessage', (screenName, message, datetimeUTC) => onNewChatMessage(socket, roomId, screenName, message, datetimeUTC));
            }
            else
                socket.disconnect();
        }
        else if (io.sockets.adapter.rooms.has(roomId))
        {
            let custId: number|null = null;
            let intrId: number|null = null;
            if (await verifyTokens(type, signumId, token))
            {
                custId = type === 'customer' ? signumId : null;
                intrId = type === 'interpreter' ? signumId : null;
            }

            createRoomData(roomId, custId, intrId, peerId, false);
            socket.join(roomId);
            socket.broadcast.to(roomId).emit('userJoined', type, signumId, peerId, screenNameRef.current, videoDivId );
            socket.on('disconnect', () => onUserDisconnect(socket, roomId, type, signumId, peerId, screenNameRef.current ) );
            socket.on('screenNameChange', (oldName, newName) => onScreenNameChange(socket, screenNameRef, videoDivId, roomId, oldName, newName)); 
            socket.on('newChatMessage', (userScreenName, message, datetimeUTC) => onNewChatMessage(socket, roomId, userScreenName, message, datetimeUTC));
            /*}
            else
            {
                createRoomData(roomId, null, null, peerId);
                socket.join(roomId);
                socket.broadcast.to(roomId).emit('userJoined', 'guest', null, peerId, screenNameRef.current, videoDivId);
                socket.on('disconnect', () => onUserDisconnect(socket, roomId, type, signumId, peerId, screenNameRef.current) );
                socket.on('screenNameChange', (oldName, newName) => onScreenNameChange(socket, screenNameRef, videoDivId, roomId, oldName, newName)); 
                socket.on('newChatMessage', (userScreenName, message, datetimeUTC) => onNewChatMessage(socket, roomId, userScreenName, message, datetimeUTC));
            }*/
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

register(roomsData, interpretersWaitingIds, customersWaitingRoomIds);