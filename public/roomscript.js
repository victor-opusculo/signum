const socket = io('/');
let peer;
let myVideoStream;
let myPeerId;
var videoGrid = document.getElementById('videoDiv')
var myvideo = document.createElement('video');
myvideo.muted = true;
const peerConnections = {}

async function enableMedia()
{
    const stream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
    myVideoStream = stream;

    addVideo(myvideo, stream);

    peer = new Peer();
    peer.on('call' , call=>
    {
        const vid = document.createElement('video');
        call.on('stream' , userStream=>{
          addVideo(vid , userStream);
        })
        call.on('error' , (err)=>{
          alert(err)
        })
        call.on("close", () => {
            console.log(vid);
            vid.remove();
        })
        call.answer(stream);

        peerConnections[call.peer] = call;
    });

    peer.on('open' , (peerId)=>
    {
        myPeerId = peerId;
        const userSignumId = Number(userId) || null; 
        const token = userType === 'interpreter' ? Cookies.get('interpreterToken') : (userType === 'customer' ? Cookies.get('customerToken') : null);
        socket.emit("newUser", userType, userSignumId, token, peerId, roomID);
    });

    peer.on('error' , (err)=>{
      alert(err.type);
    });
}

socket.on('userJoined' , (type, signumId, peerId)=>{
  console.log("new user joined");
  
  if (type === 'interpreter')
  {
      alert("intérprete entrou!");

      if (document.getElementById('btnCallNewInterpreter'))
        document.getElementById('btnCallNewInterpreter').remove();
  }

  const call  = peer.call(peerId , myVideoStream);
  const vid = document.createElement('video');
  call.on('error' , (err)=>{
    alert(err);
  })
  call.on('stream' , userStream=>
  {
    addVideo(vid , userStream);
  })
  call.on('close' , ()=>
  {
    vid.remove();
    console.log("user disconect")
  })
  peerConnections[peerId] = call;
})
socket.on('userDisconnect' , (type, signumId, peerId)=>
{
    if (peerConnections[peerId])
        peerConnections[peerId].close();

    if (type === 'interpreter' && userType === 'customer')
        addCallInterpreterButton();
});

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
        document.getElementById('btnCallNewInterpreter').remove();
        socket.emit('customerWaiting', roomID);
    }

    document.getElementById('videoDiv').appendChild(button);
}

function addVideo(video , stream)
{
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => video.play());
    videoGrid.append(video);
}

function sendChatMessage(e)
{
    const textBox = document.getElementById('txtChatNewMessage');
    const ul = document.getElementById('chatMessageList');
    const newLi = document.createElement('li');
    newLi.innerText = `{Usuário} (${new Date().toLocaleString()}): ${textBox.value}`;

    ul.appendChild(newLi);
    textBox.value = "";
}

enableMedia();

if (userType === 'customer')
  addCallInterpreterButton();