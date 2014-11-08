var interval = null;
setWatch(function(e) {
	// interprete only when button goes up
	if ( e.state ) { // true = down, false = up
		return;
	}

	if ( interval ) {
		stop();
	}
	else {
		start();
	}
}, BTN, true);

function start () {
	interval = setInterval(function() {
		LED1.write(Math.round(Math.random()));
		LED2.write(Math.round(Math.random()));
		LED3.write(Math.round(Math.random()));
	}, 500);
}

function stop () {
	clearInterval(interval)
	interval = null;
}

start();