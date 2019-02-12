'use strict'

const debug = require('debug')('webmon')
const Rtl433adapter = require('./rtl433adapter.js')
const Pms5003adapter = require('./pms5003adapter.js')
const Rtl433EventCache = require('./rtl433eventcache.js')
const CloudwatchPublisher = require('./cloudwatch-publisher.js')
const express = require('express')
const path = require('path')

// ==== Express app
debug('starting')
var app = express()
app.set('port', (process.env.PORT || 3000))
app.use('/', express.static(path.join(__dirname, 'public')))

// Express: middleware to set headers
app.use(function (req, res, next) {
  // Set permissive CORS header
  res.setHeader('Access-Control-Allow-Origin', '*')
  // Disable caching so we'll always get the latest
  res.setHeader('Cache-Control', 'no-cache')
  next()
})

var server = app.listen(app.get('port'), function () {
  debug('Server started on: http://localhost:' + app.get('port'))
  console.log('Server started on: http://localhost:' + app.get('port'))
})

// ==== Socket.io
var io = require('socket.io')(server)

/** websocket connection handler */
io.on('connection', function (socket) {
  debug('New client connected')

  eventCache.getEvents().forEach(function (event) {
    debug('sendng new client cached event: %o', event)
    socket.emit('sensor_event', event)
  })
})

// ==== RTL433 radio
const rtl433Options = { devices: [19, 33, 43] }
const rtl433 = new Rtl433adapter(rtl433Options)
rtl433.on('sensor_event', processEvent)

// ==== PMS5003 air-quality sensor
const pms5003Options = { serialdevice: '/dev/serial0' }
const pms5003 = new Pms5003adapter(pms5003Options)
pms5003.on('sensor_event', processEvent)

const eventCache = new Rtl433EventCache()

const publisher = new CloudwatchPublisher()

/**
 * Process a sensor_event:
 * cache and send to all connected websockets
 * @param {object} event - event structure as output by rtl_433
 */
function processEvent (event) {
  debug('sensor_event: %O', event)
  eventCache.store(event)
  io.volatile.emit('sensor_event', event)
  publisher.newEvent(event)
}
