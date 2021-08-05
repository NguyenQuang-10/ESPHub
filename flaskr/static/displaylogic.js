function getWindowSize(){
    var x = window.innerWidth;
    var y = window.innerHeight;

    return [x,y];
}

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
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

var myModal = document.getElementById('myModal')
var myInput = document.getElementById('myInput')

// myModal.addEventListener('shown.bs.modal', function () {
//   myInput.focus()
// })

var channelNumTracker = 0;

$('#newnodemodal').on('hide.bs.modal', function () {
    channelNumTracker = 0;
    var chnform = document.getElementById("chnform");
    chnform.innerHTML = "";
    var errors = document.getElementsByClassName("formerror");
    for (var i = 0; i < errors.length; ++i){
        errors[i].innerHTML = "";
    }
})

function addChannel(){

    // <h5>Channel <span id="chnnum"></span></h5>
    // <label for="chnname">Channel Name</label> <br>
    // <input type="text" maxlength="50" id="chnname" name="chnname"><br><br>
    // <label for="chninp">Channel Input Type: </label> <br>
    // <select id="chninp" name="chninp">
    //     <option value="switch">Switch</option>
    //     <option value="variable">Slider</option>
    // </select><br><br>
    // <label for="chndesc">Channel Description</label>
    // <input type="text" maxlength="200" id="chndesc" name="chndesc"><br><br></br>
    
    channelNumTracker += 1;
    var chnform = document.getElementById("chnform");
    // new html for channel form, i dont know how to use format string lmao
    var cfHtmlString = '<div><h5>Channel ' + channelNumTracker.toString() + ' </h5> \
    <label for="chn' + channelNumTracker.toString() + 'name">Channel Name:</label> <br> \
    <input type="text" maxlength="50" id="chn' + channelNumTracker.toString() + 'name" name="chn' + channelNumTracker.toString() + 'name"><br><br> \
    <label for="chn' + channelNumTracker.toString() + 'inp">Channel Input Type: </label> <br> \
    <select id="chn' + channelNumTracker.toString() + 'inp" name="chn' + channelNumTracker.toString() + 'inp"> \
        <option value="switch">Switch</option> \
        <option value="variable">Slider</option> \
    </select><br><br> \
    <label for="chn' + channelNumTracker.toString + 'desc">Channel Description:</label> \
    <input type="text" maxlength="200" id="chn' + channelNumTracker.toString + 'desc" name="chn' + channelNumTracker.toString + 'desc"><br><br></div>'
    
    var cfclone = htmlToElement(cfHtmlString);

    chnform.appendChild(cfclone);

}

function removeChannel(){
    var chnform = document.getElementById("chnform");
    chnform.removeChild(chnform.lastChild);
    channelNumTracker -= 1;
}


function submitForm(id){
    var form = document.getElementById(id);
    form.preven
    form.submit();
    console.log("shit");
}

function validateNodeForm(){
    var containError = false;
    let nodeform = document.forms["nodeform"];
    if (!(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(nodeform["nodeip"].value))){
        document.getElementById("nodeformIPerror").innerHTML = "Invalid IPv4 address";
        console.log("penis")
        containError = true;
    }
    if (containError == false){
        submitForm("nodeform");
    }
}