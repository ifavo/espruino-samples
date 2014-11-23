// include some libraries
var deepMerge = require('org.favo.deepmerge').deepmerge;


/**
 * status object will contain the latest data
 */
var status = {};

/**
 * configuration of the components and intervals
 */
var config = {
  nrf: {
    spi: (function () { SPI1.setup({sck:A5, miso:A6, mosi:A7}); return SPI1; })() ,
    ce: B0,
    csn: B1,
    network: {
      local: [0,0,0,0,2],
      remote: [0,0,0,0,1]
    }
  },
  cc3000: {
    sid: "",
    password: "",
    spi: (function () { SPI3.setup({sck:B3, miso:B4, mosi:B5, baud:1000000, mode: 1}); return SPI3; })() ,
    cs: C6,
    en: C7,
    irq: C8
  },
  log: "log-%day.txt"

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
  setInterval(function() {
    while (nrf.getDataPipe() !== undefined) {
      var data = nrf.getData();

      for (var i in data) {
        var ch = data[i];
        if (ch===0 && dataLine!=="") {

          // remove noise in the beginning of the line
          if ( dataLine.indexOf('{') > 0 ) {
            dataLine = dataLine.substr(dataLine.indexOf('{'));
          }

          // remove noise at the end of the line
          if ( (dataLine.lastIndexOf('}')+1) != dataLine.length ) {
            dataLine = dataLine.substr(0, dataLine.lastIndexOf('}') + 1);
          }

          if ( dataLine.substr(0,1) == "{" && dataLine.substr(-1) == "}" ) {
            status.lastNrfPacket = dataLine;
            try {
              // replace -1 values because JSON.parse fails on them
              // https://github.com/espruino/Espruino/issues/456
              while ( dataLine.indexOf(":-1") >= 0 ) {
                dataLine = dataLine.replace(':-1', ':\"-1\"');
              }
              handleNrfInput(JSON.parse(dataLine));
            }
            catch (e) {
              // ignore failed packets...
            }
          }

          dataLine = "";
        } else if (ch!==0) {
          dataLine += String.fromCharCode(ch);
        }
      }
    }
  }, 50);
}


/**
 * handle received data objects
 * @param {Object} data
 */
function handleNrfInput(data) {
  // ignore empty/invalid values
  if ( !data ) {
    return;
  }
  // append data to current status
  status.data = deepMerge(status.data, data);
  status.lastUpdate = getTime();
  require('fs').appendFile(config.log.replace('%day', Math.ceil(getTime() / 86400)), JSON.stringify(status) + "\n");
}





var wlan;


/**
 * handle wlan status updates
 * @param {String} res
 */
function wlanStatusUpdate (res) {
  switch (res) {
    case "dhcp":
      status.wlan = wlan.getIP();

      // start http server
      LED3.write(1);
      require("http").createServer(onPageRequest).listen(80);
      setTimeout("LED3.write(0);", 5000);
      break;

    case "disconnect":
      setTimeout(connectWlan, 5000);
      break;
  }
}

/**
 * trigger wlan connection
 */
var reconnectWlanInterval;
function connectWlan() {
  wlan = require("CC3000").connect(config.cc3000.spi, config.cc3000.cs, config.cc3000.en, config.cc3000.irq);
  wlan.connect(config.cc3000.sid, config.cc3000.password, wlanStatusUpdate);
}


/**
 * HTTP Request handler
 * @param {Object} req
 * @param {Object} res
 */
function onPageRequest(req, res) { 
  res.writeHead(200, {"Content-Type": "application/json"});
  res.end(JSON.stringify(status));
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

  // wlan connection
  connectWlan();

  // nrf reading
  initNrf();

  // display ready status by led
  LED1.write(0);
}

LED1.write(1);
setTimeout(onInit, 10000);