/**
 * this does test input from:
 * - motion sensor
 * - distance sensor
 * - temperature
 * - light dependent resistor
 * - onboard button
 *
 * and tests output depending on that on:
 * - onboard LEDs
 * - LEDs
 * - speaker
 * - servo
 *
 * otherwise it tests:
 * - wifi with cc3000
 * - http status server
 */


// the config...
var config = {
	updateInterval: 1000,
	sensor: {
		motion: A1,
		distance: [C2,C3],
		temperature: A0,
		light: A2,
		infrared: A7
	},
	
	output: {
		motion: {
			led: C9,
			sound: A10
		},
		distance: {
			led: [C6, C7, C8]
		},
		servo: A15
	},
	
	wlan: {
		sid: "",
		password: ""
	},

	status: {
		init: false
	}
};


// global vars for whatever is connected
var motion, distance, servo, wlan;

function init() {

	// startup visualization with internal LEDs
	LED1.write(1);
	LED2.write(0);
	LED3.write(0);


	// connecting motion sensor
	if ( config.sensor.motion ) {
		console.log("connecting motion sensor...");
		motion = setWatch(function (e) {
			config.status.motion = e;
			console.log("motion detected", e);
			analogWrite(config.output.motion.led,1.0);
			setTimeout(function () {
				analogWrite(config.output.motion.led,0);
			}, 5000);

			analogWrite(config.output.motion.sound,0.01);
			setTimeout(function () {
				analogWrite(config.output.motion.sound,0);
			}, 100);

		}, config.sensor.motion, {repeat: true, edge: 'rising'});
	}


	// connecting distance sensor
	if ( config.sensor.distance ) {
		console.log("connecting distance sensor...");
		distance = require("HC-SR04").connect(config.sensor.distance[0],config.sensor.distance[1],function(dist) {
			config.status.distance = Number(dist);
	
			if ( config.status.distance < 10 ) {
				analogWrite(config.output.distance.led[0],1.0);
				analogWrite(config.output.distance.led[1],1.0);
				analogWrite(config.output.distance.led[2],1.0);
			}
			else if ( config.status.distance < 20 ) {
				analogWrite(config.output.distance.led[0],1.0);
				analogWrite(config.output.distance.led[1],1.0);
				analogWrite(config.output.distance.led[2],0.0);
			}
			else if ( config.status.distance < 30 ) {
				analogWrite(config.output.distance.led[0],1.0);
				analogWrite(config.output.distance.led[1],0.0);
				analogWrite(config.output.distance.led[2],0.0);
			}
			else {
				analogWrite(config.output.distance.led[0],0.0);
				analogWrite(config.output.distance.led[1],0.0);
				analogWrite(config.output.distance.led[2],0.0);
			}
		});
	}

	// connecting servo
	if ( config.output.servo ) {
		console.log("connecting servo...");
		servo = require("servo").connect(config.output.servo);
		servo.move(0);
	}

	// connecting wlan
	if ( config.wlan ) {
		console.log("connecting wlan...");
		wlan = require("CC3000").connect();
		wlan.connect( config.wlan.sid, config.wlan.password, function (s) { 
			if ( s == "dhcp" ) {
				config.status.wlan = wlan.getIP();
				console.log("wlan", "connected", config.status.wlan);
				
				// starting http server
				require("http").createServer(onPageRequest).listen(80);
			}
		});
	}


	// startup visualization with internal LEDs
	LED1.write(0);
	LED2.write(0);
	LED3.write(1);
}

function intervalFunc() {
	// indicate loop run
	LED2.write(1);


	// update distance by sending pulse
	if ( distance ) {
		distance.trigger();
	}
	
	// update temperature
	config.status.temperature = Math.round(analogRead(config.sensor.temperature) * 1000)/10;

	// update light
	config.status.light = analogRead(config.sensor.light);

	// debug log
//	console.log("status", config.status);


	// indicate loop run
	LED2.write(0);
}

function onPageRequest(req, res) { 
	res.writeHead(200, {"Content-Type": "application/json"});
	res.end(JSON.stringify(config.status));
	
	if ( servo ) {
		servo.move(0, 1000, function() {
		  servo.move(1, 1000);
		});
	}
}



// listen for button start/stop
var intervalUpdate = null;
setWatch(function(e) {
	console.log("BTN", e);
	
	// interprete only when button goes up
	if ( e.state ) { // true = down, false = up
		return;
	}

	// manual init
	if ( !config.status.init ) {
		init();
	}

	// toggle interval updates	
	if (intervalUpdate) {
		LED3.write(1);
		clearInterval(intervalUpdate);
		intervalUpdate = null;
		console.log("stopped interval");
	}
	else {
		LED3.write(0);
		intervalUpdate = setInterval(intervalFunc, config.updateInterval);
		console.log("started interval");
	}
}, BTN, true);




// show that we are ready
LED2.write(1);
