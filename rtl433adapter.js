var EventEmitter = require('events').EventEmitter;
var util = require('util');

util.inherits(Rtl433adapter, EventEmitter);

/**
 * @constructor
 * @param child - spawned child_process
 */
function Rtl433adapter(child){
	var self = this;
	var lineBuffer = '';

	// call the super constructor to initialize `this`
	EventEmitter.call(this);

	// subclass extensions

	child.stdout.on('data', function(data){
		lineBuffer += data;
		let newlinePos = lineBuffer.indexOf("\n");
		if (newlinePos != -1){
			let readingString = lineBuffer.substring(0,newlinePos);
			lineBuffer = lineBuffer.substring(newlinePos+1);
			var reading = JSON.parse(readingString);
			self.emit('sensor_event', reading);
		}
	});

};


module.exports = Rtl433adapter;