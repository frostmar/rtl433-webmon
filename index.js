'use strict';

const spawn = require('child_process').spawn;
const Rtl433adapter = require('./rtl433adapter.js');
const express = require('express');
const path = require('path');


//==== Express app

var app = express();
app.set('port', (process.env.PORT || 3000));
app.use('/', express.static(path.join(__dirname, 'public')));

// Express: middleware to set headers
app.use(function(req, res, next) {
    // Set permissive CORS header
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Disable caching so we'll always get the latest
    res.setHeader('Cache-Control', 'no-cache');
    next();
});

// Express: static sensor_event data REST endpoint
app.get('/api/events', function(req, res) {
    res.json({'Temperature': 12.34});
});

var server = app.listen(app.get('port'), function() {
  console.log('Server started: http://localhost:' + app.get('port'));
});


//==== Socket.io
var io = require('socket.io')(server);

io.on('connection', function (socket) {
	console.log('New client connected!');
});


//==== RTL_433 process
var rtlChildProcess = spawn('rtl_433', ['-F', 'json', '-R', '43']);
var rtl433 = new Rtl433adapter(rtlChildProcess);

rtl433.on('sensor_event', (event) => {
	console.log('sensor_event', event);
	io.volatile.emit('sensor_event', event);
});

// send fake sensor_events
/*
setInterval(sendRandomSensorEvent, 1000);
function sendRandomSensorEvent(socket) {
	var temp = Math.random();
	console.log('sending:', temp);
	io.volatile.emit('sensor_event', {'Temperature': temp});
};
*/
