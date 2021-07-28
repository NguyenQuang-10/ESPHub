function getWindowSize(){
    var x = window.innerWidth;
    var y = window.innerHeight;

    return [x,y];
}

function updateSidebar(){
    var size = getWindowSize();
    var x = size[0];

    if (x < 960){
        document.getElementById("widesidebar").style.display = 'none';
        document.getElementById("narrowsidebar").style.display = 'block';
    } else {
        document.getElementById("narrowsidebar").style.display = 'none';
        document.getElementById("widesidebar").style.display = 'block';
    }
}

window.onload = updateSidebar;
window.onresize = updateSidebar;