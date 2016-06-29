'use strict';

var spawn = require('child_process').spawn;
var Rtl433adapter = require('./rtl433adapter.js');

var rtlChildProcess = spawn('rtl_433', ['-F', 'json', '-R', '43']);
var rtl433 = new Rtl433adapter(rtlChildProcess);

rtl433.on('sensor_event', (event) => {
	console.log('sensor_event', event);
})