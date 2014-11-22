
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
  cc3000: {
    spi: (function () { SPI1.setup({sck: B3, miso: B4, mosi: B5, baud:1000000, mode: 1}); return SPI1; })() ,
    cs: C1,
    en: C2,
    irq: C3,
    accessPoint: "",
    accessPassword: ""
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
  status.lastUpdate = getTime();
}

/**
 * update the temperature readings
 * @param {Object} data
 */
function updateTemperature(data) {
  status.temperature = data.temp;
  status.humidity = data.rh;
  status.lastUpdate = getTime();
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
  status.lastUpdate = getTime();
}

/**
 * update visible light
 * @param {Number} value
 */
function updateLightVisible (value) {
  status.luminosity[tsl.gain] = value;
  status.lastUpdate = getTime();
}





var wlan;


/**
 * handle wlan status updates
 * @param {String} res
 */
function wlanStatusUpdate (res) {
  console.log(res);

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
  wlan.connect(config.cc3000.accessPoint, config.cc3000.accessPassword, wlanStatusUpdate);
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
function onInit () {
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

  // WiFi Setup
  connectWlan();
}


// display init status with an LED
LED1.write(1);