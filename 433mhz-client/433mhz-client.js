var b = 0; // binary data
var l = 16; // packet length
var w; // watch id
var pin = A0; // PIN to listen on

// temp vars
var lc = 16; // temp. packet counter for measuring packet length
var ld = 0; // ignore packets older than the last ones by logging their time here

/**
 * handle incoming data packets
 * @param {String} data binary string
 */
function parseRx(data) {
  console.log("0b" + data);
  if ( !w ) {
    setTimeout(startListener, 10);
  }
}

/**
 * handle signal off and compile packets
 * @param {Event} e watch event data
 */
function sigOff(e) {
  if (e.time < ld) return;
  var d=e.time-e.lastTime;
  if (b && d>0.005 || !lc) {
    if ( !lc ) {
      w = clearWatch(w);
      ld = e.time;
      parseRx(b.toString(2));
    }
    b = 0;
    lc = l;
  }
  else if (d>0.0001 && d<0.001) {
    b = (b<<1) | (d>=0.0004);
    lc--;
  }
}


/**
 * toggle listening to incoming data
 */
function toggleListener () {
  if ( w ) {
    stopListener();
  }
  else {
    startListener();
  }
}

/**
 * start listening for new signals
 */
function startListener() {
  w = setWatch(sigOff, pin, {repeat: true, debounce: 0.35, edge: "falling"});
}


/**
 * stop existing listeners
 */
function stopListener (){
  w = clearWatch(w);
}

// start listening when the button is pressed…
setWatch(toggleListener, BTN1, {repeat: true, edge: "falling"});





