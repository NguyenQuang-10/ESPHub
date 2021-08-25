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

// add description functionality later
function getChannelDocFrag(tempid, name, ip, desc=null){
    var template = document.getElementById(tempid)
    var clone = template.content.cloneNode(true);
    var inputTag = clone.querySelector('input');
    inputTag.dataset.name = name;
    inputTag.dataset.ip = ip;
    clone.querySelector('.channelLabel').innerHTML = name;

    return clone;
}

socketio.on("init", function(nodestr){
    console.log(document.getElementById('homepage').offsetHeight);
    const nodejson = JSON.parse(nodestr);
    console.log(nodestr);
    document.getElementById("hostname").innerHTML = nodejson["platformdata"]["hostname"];
    document.getElementById("hostIP").innerHTML = nodejson["platformdata"]["ip"];
    nodesArea = document.getElementById('nodesArea');
    nodesArea.innerHTML = "";
    for (const node in nodejson['nodes']){
        console.log(node)
        var nodeContainerTemplate = document.getElementById('nodeContainerTemplate');
        var nodeContainer = nodeContainerTemplate.content.cloneNode(true);

        nodeContainerId = node + '_container';

        nodeContainer.querySelector('.contentContainer').id = nodeContainerId;
        nodeContainer.querySelector('.nodetitle').innerHTML = node;
        var ip = nodejson['nodes'][node]['ip'];
        nodeContainer.querySelector('.nodecontainerip').innerHTML = ip;
        nodeContainer.querySelector('.descContainer').innerHTML = nodejson['nodes'][node]['desc']

        for (const channel in nodejson['nodes'][node]['channels']){
            var inptype = nodejson['nodes'][node]['channels'][channel]['inp'];
            var channelDocFrag;
            if (inptype === 'switch'){
                channelDocFrag = getChannelDocFrag('channelSwitchInputTemplate', channel, ip, null);
            } else if (inptype === 'variable'){
                channelDocFrag = getChannelDocFrag('channelSliderInputTemplate', channel, ip, null);
            }
            nodeContainer.querySelector('.channelsContainer').appendChild(channelDocFrag, channel, null);
        }

        nodesArea.appendChild(nodeContainer);
    }
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
    channelNumTracker += 1;
    var chnform = document.getElementById("chnform");
    // new html for channel form,
    // When i did this i didn't know about templates, so... yeah sorry
    // TODO HERE: Replace this string with HTML template
    var cfHtmlString = '<div><h5>New Channel ' + channelNumTracker.toString() + ' </h5> \
    <label for="chn' + channelNumTracker.toString() + 'name">Channel Name:</label> <br> \
    <input type="text" maxlength="20" id="chn' + channelNumTracker.toString() + 'name" name="chn' + channelNumTracker.toString() + 'name"> \
    <p class="formerror" id="newnodeform_chn' + channelNumTracker.toString() + 'name_error"></p> \
    <label for="chn' + channelNumTracker.toString() + 'inp">Channel Input Type: </label> <br> \
    <select id="chn' + channelNumTracker.toString() + 'inp" name="chn' + channelNumTracker.toString() + 'inp"> \
        <option value="switch">Switch</option> \
        <option value="variable">Slider</option> \
    </select><br><br> \
    <label for="chn' + channelNumTracker.toString() + 'desc">Channel Description:</label> \
    <input type="text" maxlength="200" id="chn' + channelNumTracker.toString() + 'desc" name="chn' + channelNumTracker.toString() + 'desc"><br><br></div>'
    
    var cfclone = htmlToElement(cfHtmlString);
    document.getElementById("newnodeform_numberOfChn").value = channelNumTracker

    chnform.appendChild(cfclone);

}

function removeChannel(){
    var chnform = document.getElementById("chnform");
    chnform.removeChild(chnform.lastChild);
    channelNumTracker -= 1;
    document.getElementById("newnodeform_numberOfChn").value = channelNumTracker
}


let newnodeform = document.forms["newnodeform"];

// NOTE: browser automatically escape "\" so thats cool
function validateNewNodeForm(){
    var formerrorsSelector = newnodeform.getElementsByClassName("formerror");

    for (var i = 0 ; i < formerrorsSelector.length; i++){
        formerrorsSelector[i].innerHTML = "";
    }

    var containError = false;
    if (!(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(newnodeform["nodeip"].value))){
        document.getElementById("newnodeform_nodeip_error").innerHTML = "Invalid IPv4 address";
        console.log("penis")
        containError = true;
    }

    

    // validate nodename and ip is unique 
    nodename = newnodeform['nodename'].value;
    nodeip = newnodeform['nodeip'].value;

    // For use with new channel form not new node form, don't send yet
    chnnames = [];

    var numberOfChn = parseInt(newnodeform['numberOfChn'].value);
    if (numberOfChn != 0){
        for(var i = 1; i <= numberOfChn; i++){
            var name = newnodeform['chn' + i.toString() + 'name'].value;
            if (chnnames.indexOf(name) == -1){
                chnnames.push(name);
            } else {
                document.getElementById('newnodeform_chn' + i.toString() + 'name_error').innerHTML = "Duplicate name, ensure channel name is <b>unique</b>";
                containError = true;
            }
        }
    }

    if (containError == false){
        socketio.emit('vldnodeform', {nodename, nodeip})        
    }
    
}

socketio.on('newNodeFormError', function(errors){
    console.log(errors);
    console.log('I hate life');
    socketio.emit('debug', errors.length);
    containError = false;
    if (errors.length > 0 ){
        for (const i in errors){
            document.getElementById('newnodeform_' + errors[i] + '_error').innerHTML = 'Duplicate detected, try something else';
        }
        containError = true;
    }

    if (containError == true){
        return false;
    } else {
        newnodeform.submit();
    }
})

if ( window.history.replaceState ) {
    window.history.replaceState( null, null, window.location.href );
}
 
function handleInput(input){
    // console.log(input.className);
    var chnname = input.dataset.name;
    var ip = input.dataset.ip;
    if (input.className === 'switchInput'){
        var checked = input.checked
        socketio.emit('input', {ip, chnname, checked})
        // if (input.checked) {
        //     // console.log("The switch is on");
            
        // } else {
        //     // console.log("the switch is off");
        // }
    } else if (input.className === 'variableInputSlider') {
        // console.log(input.value);
        var value = input.value;
        socketio.emit('input', {ip, chnname, value})
    }
}

function scanIP(){
    socketio.emit('scanIP', "")
}