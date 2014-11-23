// setup SPI
var spi = new SPI();
spi.setup({mosi: C1, sck: C2});
var latchPin = A0;

// get the register
var register = require('org.favo.shiftregister').connect(spi, latchPin);


// set start pin to light
var pin = 0;

// maximum number of pins available
var max = 7;

// set direction to walk
var direction = 1;

// how long to light a single light
var ms = 250;

/**
 * the loop
 */
function loop() {

  // set previous pin off
  register.off(pin),

  // move to next pin
  pin += direction;

  // set next pin on
  register.on(pin);

  // if the maximum is reached, change direction
  if ( pin >= max ) {
    direction = -1;
  }

  // if the minimum is reached, change direction too
  else if ( pin <= 0 ) {
    direction = 1;
  }
}

// loop every n-miliseconds
setInterval(loop, ms);