function getWindowSize(){
    var x = window.innerWidth;
    var y = window.innerHeight;

    return [x,y];
}

function updateLayout(){
    var size = getWindowSize();
    var x = size[0];

    if (x < 965){
        document.getElementById("widesidebar").style.display = 'none';
        document.getElementById("narrowsidebar").style.display = 'inline-block';
    } else {
        document.getElementById("narrowsidebar").style.display = 'none';
        document.getElementById("widesidebar").style.display = 'inline-block';
    }
}

window.onload = updateLayout;
window.onresize = updateLayout;

const socketio = io();
socketio.on('connect', function(){
    socketio.emit('init', "")
    console.log('Socket.IO connection successful')
})

socketio.on("init", function(nodestr){
    const nodejson = JSON.parse(nodestr)
    console.log(nodestr)
    document.getElementById("hostname").innerHTML = nodejson["platformdata"]["hostname"]
    document.getElementById("hostIP").innerHTML = nodejson["platformdata"]["ip"]
})



function testWS(){
    console.log("Big Penis");
    socketio.emit('eventbigpenis', "Pemis");
}