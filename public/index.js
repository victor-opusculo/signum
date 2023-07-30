const socket = io('/');
const peer = new Peer();
let myVideoStream;
let myId;
var videoGrid = document.getElementById('videoDiv')
var myvideo = document.createElement('video');
myvideo.muted = true;
const peerConnections = {}

async function enableMedia()
{
    const stream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
    myVideoStream = stream;

    addVideo(myvideo, stream);
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
}

peer.on('open' , (id)=>{
  myId = id;
  socket.emit("newUser" , id , roomID);
});

peer.on('error' , (err)=>{
  alert(err.type);
});
socket.on('userJoined' , id=>{
  console.log("new user joined")
  const call  = peer.call(id , myVideoStream);
  const vid = document.createElement('video');
  call.on('error' , (err)=>{
    alert(err);
  })
  call.on('stream' , userStream=>{
    console.log('stream2');
    addVideo(vid , userStream);
  })
  call.on('close' , ()=>{
    vid.remove();
    console.log("user disconect")
  })
  peerConnections[id] = call;
})
socket.on('userDisconnect' , id=>{
  if(peerConnections[id]){
    peerConnections[id].close();
  }
})
function addVideo(video , stream)
{
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  })
  videoGrid.append(video);
}

enableMedia();