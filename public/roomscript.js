const socket = io('/');
let peer;
let myVideoStream;
let enableAudio = true;
let enableVideo = true;
let myScreenStream;
let myPeerId;
let myVideoDivId = new Date().valueOf() + Math.random();
let streamMode = 'camera';
var videoGrid = document.getElementById('videoDiv')
var myvideo = document.createElement('video');
myvideo.muted = true;

let streamMixer;
let recorder;

const peerConnections = {}

const myStreamConstraints = 
{
    audio: { sampleRate: 128 },
    video: { height: { max: 720 }, frameRate: 25 }
};

function beginRecording(initialStream)
{
    try
    {
        if (!recorder)
        {
            if (!streamMixer)
            {
                streamMixer = new MultiStreamsMixer([ initialStream ]);
                streamMixer.frameInterval = 25;
                streamMixer.startDrawingFrames();
            }
            recorder = new MediaRecorder(streamMixer.getMixedStream(), { mimeType: 'video/webm;codecs=avc1' });

            recorder.ondataavailable = event =>
            {
                socket.emit("recordStream", roomID, event.data)
            };

            recorder.start(1000);

            window.addEventListener("beforeunload", e =>
            {
                recorder.stop();
            });
        }
    }
    catch(err) { console.error(err); }
}

function addToRecording(stream)
{
    if (streamMixer)
    {
        streamMixer.appendStreams([ stream ]);
    }
}

async function enableMedia()
{
    
    const stream = await navigator.mediaDevices.getUserMedia(myStreamConstraints);
    myVideoStream = stream;

    addVideo(myvideo, stream, screenName, myVideoDivId);
    return stream;
}

function afterEnableMedia(stream)
{
    peer = new Peer(
    {
        config: {'iceServers': [
          { url: 'stun:stun.l.google.com:19302' },
          { url: 'stun:stun1.l.google.com:19302' }
        ]}
    });
    peer.on('call' , call=>
    {
        const vid = document.createElement('video');
        let id;
        call.on('stream' , userStream=>
        {
            if (document.getElementById('btnCallNewInterpreter') && call.metadata?.userType == 'interpreter')
                document.getElementById('btnCallNewInterpreter').remove();

            if (id !== userStream.id)
            {
                id = userStream.id;
                addVideo(vid , userStream, call.metadata?.userScreenName, call.metadata?.videoDivId);
                addToRecording(userStream);
            }

        })
        call.on('error' , (err)=>{
          alert(err)
        })
        call.on("close", () => 
        {
            removeVideo(vid);
        })
        call.answer(stream);

        peerConnections[call.peer] = call;
    });

    peer.on('open' , (peerId)=>
    {
        myPeerId = peerId;
        const userSignumId = Number(userId) || null; 
        const token = userType === 'interpreter' ? Cookies.get('interpreterToken') : (userType === 'customer' ? Cookies.get('customerToken') : null);
        socket.emit("newUser", userType, userSignumId, token, peerId, roomID, screenName, myVideoDivId, relatedCustomerId || null, () =>
        {
            socket.emit("askForRecord", roomID, response => 
            {
                if (response) 
                    beginRecording(stream);
            });
        });
    });

    peer.on('error' , (err)=>{
      alert(err.type);
    });
}

socket.on('userJoined' , (type, signumId, peerId, userScreenName, videoDivId)=>
{  
  if (type === 'interpreter')
  {
      sendRoomNotificationInChat(`${userScreenName} (intérprete) entrou na sala.`);

      if (document.getElementById('btnCallNewInterpreter'))
          document.getElementById('btnCallNewInterpreter').remove();
  }
  else
      sendRoomNotificationInChat(`${userScreenName} entrou na sala.`);

  const call  = peer.call(peerId , myVideoStream, { metadata: { userScreenName: screenName, videoDivId: myVideoDivId, userType } });
  const vid = document.createElement('video');
  let id;
  call.on('error' , (err)=>{
    alert(err);
  })
  call.on('stream' , userStream=>
  {
      if (id !== userStream.id)
      {
        id = userStream.id;
        addVideo(vid , userStream, userScreenName, videoDivId);
        addToRecording(userStream);
      }
  })
  call.on('close' , ()=>
  {
      removeVideo(vid);
  })
  peerConnections[peerId] = call;
});

socket.on('userDisconnect' , (type, signumId, peerId, userScreenName)=>
{
    if (peerConnections[peerId])
        peerConnections[peerId].close();

    if (type === 'interpreter' && (userType === 'customer' || userType === 'guest'))
        addCallInterpreterButton();

    if (type === 'interpreter')
        sendRoomNotificationInChat(`${userScreenName} (intérprete) saiu da sala.`);
    else
        sendRoomNotificationInChat(`${userScreenName} saiu da sala.`);
});

socket.on('sessionSurvey', sessId =>
{
    if (((userType === 'guest' && relatedCustomerId) || userType === 'customer') && sessId)
    {
        document.getElementById('divSurvey').classList.add('flex');
        document.getElementById('divSurvey').classList.remove('hidden');

        document.getElementById('btnSendSurvey').onclick = function()
        {
            const form = document.getElementById('frmSessionSurvey');
            const points = form.elements['surveyPoints'].value !== '' ? Number(form.elements['surveyPoints'].value) : null;

            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            const body = JSON.stringify({ data: { points, sessId } });
            fetch('/script/translation_sessions_savesurvey', { headers, body, method: 'POST' });

            document.getElementById('divSurvey').classList.add('hidden');
            document.getElementById('divSurvey').classList.remove('flex');
        };
    }
})

socket.on('chatMessageReceived', receiveChatMessage);
socket.on('screenNameChanged', receiveScreenNameChange);
socket.on('disconnect', () => window.location.href = '/page/homepage/home?messages=Você foi desconectado');

function addCallInterpreterButton()
{
    if (document.getElementById('btnCallNewInterpreter')) return;

    const button = document.createElement('button');
    button.id = 'btnCallNewInterpreter';
    button.innerText = "Chamar novo intérprete";
    button.className = 'btn';
    button.type = 'button';
    button.onclick = () =>
    {
        const btn = document.getElementById('btnCallNewInterpreter');
        btn.disabled = true;
        btn.innerHTML = `${spinner}<br/>Procurando um intérprete disponível. Aguarde.`;
        socket.emit('customerWaiting', roomID);
    }

    document.getElementById('videoDiv').appendChild(button);
}

function addVideo(video, stream, userScreenName, videoDivId)
{
    const div = document.createElement('div');
    div.id = 'video_div_' + videoDivId;
    div.className = 'relative w-full h-full';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'absolute block bottom-0 left-0 p-1 m-1 rounded right-0 text-left text-white bg-black/70';
    nameSpan.innerText = userScreenName;

    const fullScreenButton = document.createElement('button');
    fullScreenButton.type = 'button';
    fullScreenButton.className = 'block absolute top-0 right-0 bg-black/50 p-2 m-1';
    fullScreenButton.innerHTML = `<img class="block w-5 h-5" src="/pics/fullscreen-by-deemakdaksina.png" alt="Tela cheia/tela pequena" title="Ver vídeo em tamanho maior/Retornar ao tamanho menor" />`;
    fullScreenButton.onclick = toggleFullScreen;

    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => video.play());

    div.appendChild(video);
    div.appendChild(fullScreenButton);
    div.appendChild(nameSpan);

    videoGrid.append(div);

    
}

function removeVideo(videoElement)
{
    const div = videoElement.parentNode;
    div.remove();

    if (streamMixer)
    {
        const videos = document.querySelectorAll('#videoDiv video');
        const streams = Array.from(videos).filter(v => v !== videoElement).map(v => v.srcObject);
        streamMixer.resetVideoStreams(streams);
    }
}

function sendRoomNotificationInChat(message)
{
    const ul = document.getElementById('chatMessageList');
    const newLi = document.createElement('li');
    newLi.innerText = `(${new Date().toLocaleString()}): ${message}`;

    ul.appendChild(newLi);
}

function receiveChatMessage(userScreenName, message, datetimeUTC)
{
    const ul = document.getElementById('chatMessageList');
    const newLi = document.createElement('li');
    const messageDate = new Date(datetimeUTC);
    newLi.innerText = `${userScreenName} (${messageDate.toLocaleString()}): ${message}`;

    ul.appendChild(newLi);
}

function receiveScreenNameChange(videoDivId, oldName, newName)
{
    const videoDiv = document.getElementById('video_div_' + videoDivId);
    if (videoDiv)
        videoDiv.querySelector('span').innerText = newName;

    sendRoomNotificationInChat(`"${oldName}" mudou o nome para "${newName}"`);
}

function toggleFullScreen()
{
    const div = this.parentNode;
    
    div.classList.toggle('!fixed');
    div.classList.toggle('top-0');
    div.classList.toggle('right-0');
    div.classList.toggle('left-0');
    div.classList.toggle('z-20');
}

async function switchCameraOrScreenShare(e)
{
    streamMode = e.target.checked ? 'screen' : 'camera';

    if (streamMode === 'camera')
    {
        const stream = await navigator.mediaDevices.getUserMedia(myStreamConstraints);
        myVideoStream = stream;
        
        myVideoStream.getVideoTracks().forEach(track => track.enabled = enableVideo);
        myVideoStream.getAudioTracks().forEach(track => track.enabled = enableAudio);

        for (const call of Object.values(peerConnections))
        {
            call.peerConnection.getSenders()[0].replaceTrack(stream.getTracks()[0]);
            call.peerConnection.getSenders()[1].replaceTrack(stream.getTracks()[1]);
        }

        const videos = document.querySelectorAll('#videoDiv video');
        const oldStream = myvideo.srcObject;
        const streams = Array.from(videos).map(v => v.srcObject).filter(s => s !== oldStream);
        streams.push(stream);
        myvideo.srcObject = stream;
        streamMixer?.resetVideoStreams(streams);
    }
    else
    {
        const displayMediaOptions = { video: { cursor: "always" }, audio: false };
        let stream;
        try
        {
            stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
            myScreenStream = stream;
            myScreenStream.getVideoTracks().forEach(track => track.enabled = enableVideo);

            for (const call of Object.values(peerConnections))
                call.peerConnection.getSenders()[1].replaceTrack(stream.getTracks()[0]);

            const videos = document.querySelectorAll('#videoDiv video');
            const oldStream = myvideo.srcObject;
            const streams = Array.from(videos).map(v => v.srcObject).filter(s => s !== oldStream);
            streams.push(stream);
            myvideo.srcObject = stream;
            streamMixer?.resetVideoStreams(streams);
        }
        catch (err)
        {
            console.error(err);
        }
    }
}

function sendChatMessage(e)
{
    const textBox = document.getElementById('txtChatNewMessage');
    const ul = document.getElementById('chatMessageList');
    const newLi = document.createElement('li');
    const messageDate = new Date();
    newLi.innerText = `${screenName} (${messageDate.toLocaleString()}): ${textBox.value}`;

    socket.emit('newChatMessage', screenName, textBox.value, messageDate.toISOString());

    ul.appendChild(newLi);
    textBox.value = "";
}

function sendNameChange()
{
    const newName = document.getElementById('txtNewScreenName')?.value;

    if (newName)
    {
        socket.emit('screenNameChange', screenName, newName);
        receiveScreenNameChange(myVideoDivId, screenName, newName);
        screenName = newName;
    }
}

function toggleVideo(e)
{
    const enabled = enableVideo = e.target.checked ?? false;
    const streamType = streamMode === 'camera' ? myVideoStream : myScreenStream;
    streamType.getVideoTracks().forEach(track => track.enabled = enabled);
}

function toggleAudio(e)
{
    const enabled = enableAudio = e.target.checked ?? false;
    myVideoStream.getAudioTracks().forEach(track => track.enabled = enabled);
}

const createEmptyAudioTrack = () => 
{
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const dst = oscillator.connect(ctx.createMediaStreamDestination());
  oscillator.start();
  const track = dst.stream.getAudioTracks()[0];
  return Object.assign(track, { enabled: false });
};

const createEmptyVideoTrack = ({ width, height }) => 
{
  const canvas = Object.assign(document.createElement('canvas'), { width, height });
  canvas.getContext('2d').fillRect(0, 0, width, height);

  const stream = canvas.captureStream();
  const track = stream.getVideoTracks()[0];

  return Object.assign(track, { enabled: false });
};

enableMedia().then(afterEnableMedia).catch( () => 
{
    const answer = confirm("Não foi possível iniciar sua câmera e microfone. Deseja participar desta sessão mesmo assim?");
    if (answer)
    {
        const audioTrack = createEmptyAudioTrack();
        const videoTrack = createEmptyVideoTrack({ width:640, height:480 });
        const mediaStream = new MediaStream([audioTrack, videoTrack]);

        afterEnableMedia(mediaStream);
    }
});

if (userType === 'customer' || userType === 'guest')
  addCallInterpreterButton();