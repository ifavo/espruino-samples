// some status vars
var mode = 0;
var modeEnforced = null;
var interval = 100;

// walk walk thru modes
setInterval(function () {

  // enforce a single mode?
  if ( modeEnforced !== null ) {
      mode = modeEnforced;
  }

  switch (true) {

    // red
    case (mode <= 20):
      LED1.write(true);
      LED2.write(false);
      LED3.write(false);
      break;

    // red + yellow
    case (mode <= 30):
      LED1.write(true);
      LED2.write(true);
      LED3.write(false);
      break;

    // green (blue)
    case (mode <= 50):
      LED1.write(false);
      LED2.write(false);
      LED3.write(true);
      break;

    // yellow
    case (mode <= 80):
      LED1.write(false);
      LED2.write(true);
      LED3.write(false);
      break;

    // reset
    default:
      mode = 0;
      break;
  }

  mode++;

}, interval);

setWatch(function(e) {
  if ( e.state ) {
    modeEnforced = 30;
  }
  else {
    modeEnforced = null;
  }
}, BTN, {repeat: true});
