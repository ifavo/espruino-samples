/**
 *	LED Status:
 *	blue = loading
 *	blue + red = file does not exist
 *	red = file could not be executed
 *	green = file read & code executed
 */

// turn the blue light on while loading
LED3.write(1);


// the application file to read
var APP_FILE = 'app.js';

function main () {

	// look if the file exists
	if ( !E.openFile (APP_FILE, 'r') ) {
      console.log("could not find", APP_FILE);

      // turn the red LED on
      LED1.write(1);
	}
	else {

      // loading indicator
      LED3.write(0);

      console.log("reading file", APP_FILE);

      // read the content of the file
      var js = fs.readFileSync(APP_FILE);
      try {
		console.log("executing code");

		// and execute it using eval
		(function() {
            eval(js);
		})();
       LED2.write(1);
        clearInterval(mainInterval);
      }
      catch (e) {
		LED1.write(1);
		console.log("catchable execution error", e);
      }
  }

}

var mainInterval = setInterval(main, 1000);