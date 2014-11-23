
/**
 * status object will contain the latest data
 */
var status = {
  infrared: {},
  luminosity: {},
  temperature: 0,
  humidity: 0,
  lastUpdate: 0
};

/**
 * configuration of the components and intervals
 */
var config = {
  tsl2561: {sda:B9, scl:B8},
  dht22: C12,
  nrf: {
    spi: (function () { SPI1.setup({sck:A5, miso:A6, mosi:A7}); return SPI1; })() ,
    ce: B0,
    csn: B1,
    network: {
      local: [0,0,0,0,1],
      remote: [0,0,0,0,2]
    }
  },
  interval: 30*1000
};




/**
 * DHT22 temperature & humidity sensor
 */
var dht;

/**
 * interval for triggering temperatur readings
 */
function readTemperature () {
  dht.read(updateTemperature);
}

/**
 * update the temperature readings
 * @param {Object} data
 */
function updateTemperature(data) {
  status.temperature = data.temp;
  status.humidity = data.rh;
}





/**
 * TSL2561 light sensor
 */

var tsl;

// helper value for toggling between infrared/visible spectrum and different gain levels
var lightSwitch = -1;


/**
 * fetch values from the sensor
 */
function readLight() {
  lightSwitch++;

  switch (lightSwitch) {

    // visible spectrum at 1x gain
    case 0:
      tsl.setGain(tsl.C._1X);
      tsl.getLuminosity(tsl.C.VISIBLE, updateLightVisible);
      break;

    // visible spectrum at 16x gain
    case 1:
      tsl.setGain(tsl.C._16X);
      tsl.getLuminosity(tsl.C.VISIBLE, updateLightVisible);
      break;

    // visible spectrum at 16x gain
    case 2:
      tsl.setGain(tsl.C._16X);
      tsl.getLuminosity(tsl.C.INFRARED, updateLightInfrared);
      break;

      // infrared spectrum at 1x gain
    case 3:
      tsl.setGain(tsl.C._1X);
      tsl.getLuminosity(tsl.C.INFRARED, updateLightInfrared);
      lightSwitch = -1;
      break;
  }
}

/**
 * update infrared value
 * @param {Number} value
 */
function updateLightInfrared (value) {
  status.infrared[tsl.gain] = value;
}

/**
 * update visible light
 * @param {Number} value
 */
function updateLightVisible (value) {
  status.luminosity[tsl.gain] = value;
  publishStatus();
}





var nrf;


/**
 * init the nrf network
 */
function initNrf() {
  nrf = require("NRF24L01P").connect(config.nrf.spi, config.nrf.ce, config.nrf.csn );
  nrf.init(config.nrf.network.local, config.nrf.network.remote);
  publishStatus();
}

/**
 * publish system status to another node
 */
function publishStatus () {
  status.lastUpdate = getTime();
  nrf.sendString(JSON.stringify(status));
}



var intervalFunc = [];
/**
 * trigger an update for each sensor
 */
function updateSensors() {
  var func = intervalFunc.shift();
  intervalFunc.push(func);
  func();
}




/**
 * init everything when system is ready
 */
var hasInit = false;
function onInit () {
  if ( hasInit ) {
    return;
  }
  hasInit = true;

  // Setup DHT22
  dht = require("DHT22").connect(config.dht22);

  // Setup luminosity sensor
  I2C1.setup(config.tsl2561);
  tsl = require('TSL2561').connect(I2C1);
  tsl.init(tsl.C.FLOAT, tsl.C._101MS, tsl.C._1X);

  // setup the update intervals
  intervalFunc.push(readLight);
  intervalFunc.push(readTemperature);
  setInterval(updateSensors, config.interval);

  // turn off the status LED
  LED1.write(0);
  LED2.write(1);
  setTimeout("LED2.write(0);", 5000);

  // networking Setup
  initNrf();
}


// display init status with an LED
LED1.write(1);


setTimeout(onInit, 10000);