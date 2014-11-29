/**
 * configuration of the components and intervals
 */
var config = {
  nrf: {
    spi: (function () { SPI1.setup({sck:A5, miso:A6, mosi:A7}); return SPI1; })() ,
    ce: B0,
    csn: B1,
    network: {
      local: [0,0,0,0,2], // local address
      remote: [0,0,0,0,1], // default sender the data is received from
      forward: [0,0,0,0,3] // where to forward received data to
    }
  }
};


var nrf;


/**
 * init the nrf network
 */
function initNrf() {
  nrf = require("NRF24L01P").connect(config.nrf.spi, config.nrf.ce, config.nrf.csn );
  nrf.init(config.nrf.network.local, config.nrf.network.remote);
  receiveNrfData();
}

/**
 * loop and watch for possible data input
 */
function receiveNrfData() {
  var dataLine = "";
  var isReadingPipe = false;

  function readDataPipe () {
    isReadingPipe = true;
    while (nrf.getDataPipe() !== undefined) {
      var data = nrf.getData();

      for (var i in data) {
        var ch = data[i];
        if ((ch===0 || ch===4) && dataLine!=="") {

          // forward data to another node
          nrf.setTXAddr(config.nrf.network.forward);
          nrf.sendString(dataLine);
          nrf.setTXAddr(config.nrf.network.remote);

          dataLine = "";
        } else if (ch!==0 && ch!==4 && ch >= 32) { // 0 = NULL, 4 = EOT, <32 = all command codes
          dataLine += String.fromCharCode(ch);
        }
      }
    }

    isReadingPipe = false;
  }

  setInterval(readDataPipe, 50);
}


/**
 * init functionality and intervals when device is ready
 */
var hasInit = false;
function onInit () {
  if ( hasInit ) {
    return;
  }
  hasInit = true;


  // nrf reading
  initNrf();

  // display ready status by led
  LED1.write(0);
}

LED1.write(1);
setTimeout(onInit, 10000);