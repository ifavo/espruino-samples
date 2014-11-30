The weather station uses an TSL2561 to capture luminosity values and infrared spectrum.  
With an DHT22 it collects temperature and humidity.  
The data is then published to another Espruino using an NRF24L01+.

On the other end a NRF24L01+ receives the data and provides a simple HTTP/JSON output on a CC3000.

The data is sent to a nodejs server which collects the data for further processing.
The server can be found at https://github.com/ifavo/espruino-pot