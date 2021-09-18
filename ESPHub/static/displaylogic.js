var nodeinfo;

var ip_node_map = new Map()

function enablePopover(){
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl)
    })

}

function dismissPopover(){
    var popover = new bootstrap.Popover(document.querySelector('.descIcon'), {
        trigger: 'focus'
    })
}

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

function updateLog(log, type){
    var logContainer = document.getElementById("logContainer");
    var time = new Date();
    var timeString = time.getDate() + '-' + time.getMonth() + '-' + time.getFullYear() + '@' + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
    logContainer.innerHTML = timeString + " | " + log;
    if (type === 'error'){
        logContainer.style.color = 'red';
    } else if (type === 'info') {
        logContainer.style.color = 'white';
    }
}

const socketio = io();
socketio.on('connect', function(){
    socketio.emit('init', "")
    console.log('Socket.IO connection successful')
})

socketio.on('log', function(data){
    updateLog(data[0], data[1]);
})

// add description functionality later
function getChannelDocFrag(tempid, parent, name, pin, ip, desc="None"){
    var template = document.getElementById(tempid)
    var clone = template.content.cloneNode(true);
    var inputTag = clone.querySelector('input');
    inputTag.dataset.name = name;
    inputTag.dataset.pin = pin;
    inputTag.dataset.ip = ip;
    inputTag.id = parent + '_' + name;
    clone.querySelector('.channelLabel').innerHTML = name + ' (GPIO: ' + pin + ')' ;
    var menu = clone.querySelector(".dropdown-content");
    menu.dataset.node = parent;
    menu.dataset.channel = name;

    var finalDesc;
    if (desc == null || desc === ""){
        finalDesc = "None";
    } else {
        finalDesc = desc;
    }
    var descIcon = clone.querySelector(".channelIcons").querySelector(".descIcon");
    descIcon.setAttribute('data-bs-content', finalDesc);

    return clone;
}

socketio.on("init", function(nodejson){
    // console.log(document.getElementById('homepage').offsetHeight);
    // const nodejson = nodestr;
    console.log(nodejson);
    nodeinfo = nodejson;
    document.getElementById("hostname").innerHTML = nodejson["platformdata"]["hostname"];
    document.getElementById("hostIP").innerHTML = nodejson["platformdata"]["ip"];
    nodesArea = document.getElementById('nodesArea');
    nodesArea.innerHTML = "";
    for (const node in nodejson['nodes']){
        // console.log(node)
        var nodeContainerTemplate = document.getElementById('nodeContainerTemplate');
        var nodeContainer = nodeContainerTemplate.content.cloneNode(true);

        nodeContainerId = node + '_container';

        nodeContainer.querySelector('.contentContainer').id = nodeContainerId;
        nodeContainer.querySelector('.contentContainer').dataset.state = nodejson['nodes'][node]['conn'];
        nodeContainer.querySelector('.dropdown-content').dataset.node = node;
        nodeContainer.querySelector('.nodetitle').innerHTML = node;
        var ip = nodejson['nodes'][node]['ip'];
        nodeContainer.querySelector('.nodecontainerip').innerHTML = ip;
        ip_node_map.set(ip, node);

        var conn = nodejson['nodes'][node]['conn'];
        var stateIcon = nodeContainer.querySelector('#connectionStateIcon');
        if (conn === 'connected'){
            // console.log(stateIcon)
            stateIcon.setAttribute("fill", 'green');
        } else if (conn === 'disconnected'){
            stateIcon.setAttribute("fill", 'red');
        }

        nodeContainer.querySelector('.descContainer').innerHTML = nodejson['nodes'][node]['desc'];

        var numberOfChannels = 0;

        for (const channel in nodejson['nodes'][node]['channels']){
            numberOfChannels++;
            var channelJSON = nodejson['nodes'][node]['channels'][channel];
            var type = channelJSON['type'];
            var pin = channelJSON['pin']
            var channelDocFrag;

            if (type === 'switch'){
                channelDocFrag = getChannelDocFrag('channelSwitchInputTemplate', node, channel, pin, ip, channelJSON['desc']);
                if (channelJSON['value'] > 0){
                    channelDocFrag.querySelector('input').checked = true;
                }
            } else if (type === 'variable'){
                channelDocFrag = getChannelDocFrag('channelSliderInputTemplate', node,channel, pin, ip, channelJSON['desc']);
                channelDocFrag.querySelector('input').value = channelJSON['value'];
            } else if (type === 'display'){
                channelDocFrag = getChannelDocFrag('channelDisplayTemplate', node, channel, pin, ip, channelJSON['desc']);
            }

            nodeContainer.querySelector('.channelsContainer').appendChild(channelDocFrag);
        }

        if (numberOfChannels == 0){
            nodeContainer.querySelector('.channelsContainer').style.display = 'none';
        }

        nodesArea.appendChild(nodeContainer);
    }
    try {
        enablePopover();
        dismissPopover();
    } catch(err) {
        console.log(err);
    }
    
})

socketio.on('updconst', function(data){
    var node = ip_node_map.get(data[1]);
    var nodeContainer = document.getElementById(node + "_container");
    var stateIcon = nodeContainer.querySelector('#connectionStateIcon');
    
    if (data[0] === "connected"){
        updateLog("Node \"" + node + "\" has connected", "info")
        stateIcon.setAttribute("fill", 'green');
        nodeContainer.dataset.state = "connected";

        var inputs = nodeContainer.getElementsByTagName('input');
        for (var i = 0; i < inputs.length; i++){
            var channel = inputs[i]
            var val = data[2][parseInt(channel.dataset.pin)]
            if (channel.type === 'checkbox'){
                if (val > 0){
                    channel.checked = true;
                } else {
                    channel.checked = false;
                }
            } else if (channel.type === 'range'){
                channel.value = val;
            }
            
        }
    } else if (data[0] == "disconnected"){
        stateIcon.setAttribute("fill", 'red');
        nodeContainer.dataset.state = "disconnected";
        updateLog("Node \"" + node + "\" has disconnected", "error")
    }
    // console.log('Test')
    // console.log(ip_node_map.get(data[1]))
    // console.log(data[2][4])
})

// NOTE: browser automatically escape "\" so thats cool
function validateNodeForm(formid){
    let nodeform = document.forms[formid];
    var formerrorsSelector = nodeform.getElementsByClassName("formerror");

    for (var i = 0 ; i < formerrorsSelector.length; i++){
        formerrorsSelector[i].innerHTML = "";
    }

    var containError = false;
    if (!(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(nodeform["nodeip"].value))){
        document.getElementById(formid + "_nodeip_error").innerHTML = "Invalid IPv4 address";
        // console.log("penis")
        containError = true;
    }    

    // validate nodename and ip is unique 
    nodename = nodeform['nodename'].value;
    nodeip = nodeform['nodeip'].value;

    if (containError == false){
            socketio.emit('vldnodeform', {formid, nodename, nodeip})
    }
    
}

socketio.on('newNodeFormError', function(data){

    // data[0] contain node type
    // data[1] contain errors, nodeip and nodename

    var form = document.forms[data[0]];
    var modalDOM = document.getElementById(data[0]);
    console.log(data);
    // console.log('I hate life');
    // socketio.emit('debug', errors.length);
    containError = false;
    if (data[1].length > 0 ){
        if (data[0] == 'newnodeform'){
            for (const i in data[1]){
                document.getElementById(data[0] + '_' + data[1][i] + '_error').innerHTML = 'Duplicate detected, try something else';
            }
            containError = true;
        } else if (data[0] == 'modifyNodeForm') {
            var noChangeList = [];
            for (const i in data[1]){
                var err = data[1][i];
                var ogval;
                if (err === "nodeip"){
                    ogval = nodeinfo['nodes'][form["ogname"].value][data[1][i].substring(4)];
                } else if (err === "nodename") {
                    ogval = form["ogname"].value;
                }
                // console.log(ogval);
                // console.log(form[err].value)
                if (form[err].value != ogval){
                    document.getElementById(data[0] + '_' + err + '_error').innerHTML = 'Duplicate detected, try something else';
                    containError = true;
                } else {
                    noChangeList.push(err);
                }
                
            }
            if (containError == false){
                for (const i in noChangeList){
                    console.log(i);
                    form[noChangeList[i]].value = "";
                }
            }
        }   
    }

    if (containError == true){
        return false;
    } else {
        form.submit();
    }
})

socketio.on("updateDisplayChannel", function(data){
    // console.log(data);
    // [0] is ip of node
    // [1] is channel name
    // [2] is value
    var node = ip_node_map.get(data[0]);
    console.log(node);
    var display = document.getElementById(node + "_" + data[1]);
    // display.value = data[2];
    if (display != null){
        display.value = data[2];
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
    formDOM['chntype'].onchange = function(){
        if (formDOM['chntype'].value === "display"){
            formDOM['chnpin'].value = 'Custom';
            formDOM['chnpin'].disabled = true;
        } else {
            formDOM['chnpin'].disabled = false;
        }
    }
    modal.show();

}

function changeNodeSetting(a){
    // console.log(nodeinfo);
    var node = a.parentNode.dataset.node;
    var modalDOM = document.getElementById("modifynodemodal");
    var modal = new bootstrap.Modal(modalDOM);
    var form = document.forms['modifyNodeForm'];
    form['ogname'].value = node;
    form['nodename'].value = node;
    form['nodeip'].value = nodeinfo['nodes'][node]['ip']
    form['nodedesc'].value = nodeinfo['nodes'][node]['desc']
    modal.show();
}

function changeChannelSetting(a){
    var modalDOM = document.getElementById("modifyChannelModal");
    var modal = new bootstrap.Modal(modalDOM);
    var formDOM = document.forms['modifyChannelForm'];

    var name = a.parentNode.dataset.channel;
    var parent = a.parentNode.dataset.node;

    var chninfo =  nodeinfo['nodes'][parent]['channels'];

    formDOM['parent'].value = parent;
    formDOM['ogname'].value = name;
    formDOM['chnname'].value = name;
    // formDOM['chninp'].value =[name]['inp'];
    formDOM['chntype'].value = chninfo[name]['type'];
    formDOM['chnpin'].value = chninfo[name]['pin'];
    formDOM['chndesc'].value = chninfo[name]['desc'];

    if (formDOM['chntype'].value === "display"){
        formDOM['chnpin'].value = 'Custom';
        formDOM['chnpin'].disabled = true;
    }

    formDOM['chntype'].onchange = function(){
        if (formDOM['chntype'].value === "display"){
            formDOM['chnpin'].value = 'Custom';
            formDOM['chnpin'].disabled = true;
        } else {
            formDOM['chnpin'].disabled = false;
        }
    }
    modal.show();
}

function validateNewChannel(formid){
    var modalDOM = document.forms[formid];
    chnname = modalDOM['chnname'].value;
    parent = modalDOM['parent'].value
    if (chnname.length > 0){
        socketio.emit('validateNewChannel', {formid, parent, chnname});
    } else {
        var errorContainer = document.getElementById(formid + '_chnname_error');
        errorContainer.innerHTML = "Please enter a name";
    } 
}

socketio.on('newChannelError', function(data){
    var form = document.forms[data[0]];
    form['chnpin'].disabled = false;
    if (data[1]){
        if (data[0] === "appendChannelForm"){

            var errorContainer = document.getElementById(data[0] + '_chnname_error');
            errorContainer.innerHTML = "Name not available, please try another name";

        } else if (data[0] === "modifyChannelForm"){

            if (form["chnname"].value === form["ogname"].value){
                form.submit()
            } else {
                var errorContainer = document.getElementById(data[0] + '_chnname_error');
                errorContainer.innerHTML = "Name not available, please try another name";

            }
        }
        
    } else {
        
        form.submit()
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
        socketio.emit('input', {ip, chnname, type, pin, value})
        // if (input.checked) {
        //     // console.log("The switch is on");
            
        // } else {
        //     // console.log("the switch is off");
        // }
    } else if (input.className === 'variableInputSlider') {
        // console.log(input.value);
        var value = input.value;
        type="pwm";
        socketio.emit('input', {ip, chnname, type, pin, value})
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