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