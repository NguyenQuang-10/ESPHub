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
function getChannelDocFrag(tempid, parent, name, pin, ip, desc=null){
    var template = document.getElementById(tempid)
    var clone = template.content.cloneNode(true);
    var inputTag = clone.querySelector('input');
    inputTag.dataset.name = name;
    inputTag.dataset.pin = pin;
    inputTag.dataset.ip = ip;
    clone.querySelector('.channelLabel').innerHTML = name + ' (GPIO' + pin + ')' ;
    var menu = clone.querySelector(".dropdown-content");
    menu.dataset.node = parent;
    menu.dataset.channel = name;

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
        nodeContainer.querySelector('.dropdown-content').dataset.node = node;
        nodeContainer.querySelector('.nodetitle').innerHTML = node;
        var ip = nodejson['nodes'][node]['ip'];
        nodeContainer.querySelector('.nodecontainerip').innerHTML = ip;
        nodeContainer.querySelector('.descContainer').innerHTML = nodejson['nodes'][node]['desc']

        var numberOfChannels = 0;

        for (const channel in nodejson['nodes'][node]['channels']){
            numberOfChannels++;
            var inptype = nodejson['nodes'][node]['channels'][channel]['inp'];
            var pin = nodejson['nodes'][node]['channels'][channel]['pin']
            var channelDocFrag;
            if (inptype === 'switch'){
                channelDocFrag = getChannelDocFrag('channelSwitchInputTemplate', node, channel, pin, ip, null);
            } else if (inptype === 'variable'){
                channelDocFrag = getChannelDocFrag('channelSliderInputTemplate', node,channel, pin, ip, null);
            }
            nodeContainer.querySelector('.channelsContainer').appendChild(channelDocFrag, channel, null);
        }

        if (numberOfChannels == 0){
            nodeContainer.querySelector('.channelsContainer').style.display = 'none';
        }

        nodesArea.appendChild(nodeContainer);
    }
})

// NOTE: browser automatically escape "\" so thats cool
function validateNewNodeForm(){
    let newnodeform = document.forms["newnodeform"];
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

    if (containError == false){
        socketio.emit('vldnodeform', {nodename, nodeip})        
    }
    
}

socketio.on('newNodeFormError', function(errors){
    let newnodeform = document.forms["newnodeform"];
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



function appendChannel(a){
    var modalDOM = document.getElementById("appendChannelModal");
    var modal = new bootstrap.Modal(modalDOM);
    var formDOM = document.forms['appendChannelForm'];
    formDOM['parent'].value = a.parentNode.dataset.node;
    modal.show();

}

function validateNewChannel(){
    var modalDOM = document.forms["appendChannelForm"];
    chnname = modalDOM['chnname'].value;
    parent = modalDOM['parent'].value
    if (chnname.length > 0){
        socketio.emit('validateNewChannel', {parent, chnname});
    } else {
        var errorContainer = document.getElementById('appendChannelForm_chnname_error');
        errorContainer.innerHTML = "Please enter a name";
    } 
}

socketio.on('newChannelError', function(duplicated){
    if (duplicated){
        var errorContainer = document.getElementById('appendChannelForm_chnname_error');
        errorContainer.innerHTML = "Name not available, please try another name";
    } else {
        var modalDOM = document.forms["appendChannelForm"];
        modalDOM.submit()
    }
})

function deleteComponent(node, channel, type){
    socketio.emit('deleteComponent', {node, channel, type});
    location.reload();
}
 
function handleInput(input){
    // console.log(input.className);
    var chnname = input.dataset.name;
    var pin = input.dataset.pin;
    var ip = input.dataset.ip;
    var type = ""
    if (input.className === 'switchInput'){
        var checked = input.checked
        type="dig";
        var value = "";
        if (checked) {
            value = 1;
        } else {
            value = 0
        }
        socketio.emit('input', {ip, type, pin, value})
        // if (input.checked) {
        //     // console.log("The switch is on");
            
        // } else {
        //     // console.log("the switch is off");
        // }
    } else if (input.className === 'variableInputSlider') {
        // console.log(input.value);
        var value = input.value;
        type="pwm";
        socketio.emit('input', {ip, type, pin, value})
    }
}

// Dropdown menu when for 3 vertical dot menu, this one is for the node menu

/* When the user clicks on the button,
toggle between hiding and showing the dropdown content */
function collapseAllMenu(){
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.style.display = "none") {
        openDropdown.style.display = "none";
      }
    }
}

function displayMenu(menu) {
    collapseAllMenu();
    menu.parentNode.getElementsByClassName('dropdown-content')[0].style.display = 'block';
}
  
//   // Close the dropdown menu if the user clicks outside of it
  window.onclick = function(event) {
    if (!event.target.matches('.vdm')) {
      collapseAllMenu();
    }
  }

  window.onscroll = function(event) {
    collapseAllMenu();
  }