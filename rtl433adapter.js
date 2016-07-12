const EventEmitter = require('events').EventEmitter;
const util = require('util');
const spawn = require('child_process').spawn;


util.inherits(Rtl433adapter, EventEmitter);

/**
 * @constructor
 * @param {object}   options
 * @param {Number[]} options.devices - rtl_433 device numbers (-R parameters) to listen for 
 */
function Rtl433adapter(options){
	var self = this;
	var lineBuffer = '';
	this.options = options;
console.log('options', options);

	// call the super constructor to initialize `this`
	EventEmitter.call(this);

	// spawn child process
	this.childProcess = this.spawnChild();

	// subclass extensions

	this.childProcess.stdout.on('data', function(data){
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

/**
 * spawn a child process
 * @private
 * @returns {ChildProcess}
 */
Rtl433adapter.prototype.spawnChild = function(){
	var args = ['-F', 'json'];
	this.options.devices.forEach( (device) => {args.push('-R'); args.push(device)});
	console.log('spawning with args:', args);
	return spawn('rtl_433', args);
};

module.exports = Rtl433adapter;