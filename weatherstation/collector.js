
/**
 * status object will contain the latest data
 */
var status = {
  ir: {},
  lum: {},
  tmp: 0,
  hum: 0,
  lastUpdate: 0
};

/**
 * configuration of the components and intervals
 */
var config = {
  power: A0, // an analog power pin is used to switch sensor powers off and on again for full resets
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
  interval: 30*1000,
  log: 'log-%day.txt'
};




/**
 * DHT22 temperature & humidity sensor
 */
var dht;

/**
 * interval for triggering temperatur readings
 */
function readTemperature () {
  config.power.write(1);
  setTimeout(function () {
    dht.read(updateTemperature);
  }, 500);
}

/**
 * update the temperature readings
 * @param {Object} data
 */
function updateTemperature(data) {
  // failed to read data
  if ( data.temp == -1 && data.rh ) {
    return;
  }
  status.tmp = data.temp;
  status.hum = data.rh;
  publishStatus('hum');
  publishStatus('tmp');
  config.power.write(0);
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

  // Setup luminosity sensor
  config.power.write(1);

  setTimeout(function () {


      // init tsl
    I2C1.setup(config.tsl2561);
    tsl = require('TSL2561').connect(I2C1);
    tsl.init(tsl.C.FLOAT, tsl.C._101MS, tsl.C._1X);
    tsl.enable();

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
  }, 500);

}

/**
 * update infrared value
 * @param {Number} value
 */
function updateLightInfrared (value) {
  tsl.disable();
  config.power.write(0);
  value = Math.floor(value);
  if ( value != 'NaN' ) {
    status.ir[tsl.gain] = value;
    publishStatus('ir');
  }
}

/**
 * update visible light
 * @param {Number} value
 */
function updateLightVisible (value) {
  tsl.disable();
  config.power.write(0);
  value = Math.floor(value);
  if ( value != 'NaN' ) {
    status.lum[tsl.gain] = value;
    publishStatus('lum');
  }
}





var nrf;


/**
 * init the nrf network
 */
function initNrf() {
  nrf = require("NRF24L01P").connect(config.nrf.spi, config.nrf.ce, config.nrf.csn );
  nrf.init(config.nrf.network.local, config.nrf.network.remote);
  nrf.setTXPower(3);
  publishStatus();
}

/**
 * publish system status to another node
 * @param {String} part optionally publish only this part of the data
 */
var sendingLimit = 0;
function publishStatus (part) {
  status.lastUpdate = Math.ceil(getTime());
  nrf.setEnabled(true);
  var i = 3;
  var sendString;
  if ( part ) {
    sendString = "{\"" + part + "\":" + JSON.stringify(status[part]) + "}";
    sendLimit = 3;
  }
  else {
    sendString = JSON.stringify(status);
  }

  sendingLimit--;
  if ( !nrf.sendString(sendString) && sendingLimit > 0 ) {
    setTimeout("publishStatus();", 1000);
  }
  else {
    sendingLimit = 0;
  }

  nrf.setEnabled(false);
  require('fs').appendFile(config.log.replace(Math.ceil(getTime()/86400)), JSON.stringify(status) + "\n");
}



var intervalFunc = [];
/**
 * trigger an update for each sensor
 */
function updateSensors() {
  // clear all watches to prevent stacking watches within some modules
  clearWatch();

  // call sensor reading
  var func = intervalFunc.shift();
  intervalFunc.push(func);
  func();

  // setup the next interval
  setTimeout(updateSensors, config.interval);
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

  // init DHT
  dht = require("DHT22").connect(config.dht22);

  // setup the update intervals
  intervalFunc.push(readLight);
  intervalFunc.push(readTemperature);
  setTimeout(updateSensors, 10000);

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