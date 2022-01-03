'use strict'

const debug = require('debug')('webmon')
const Rtl433adapter = require('./rtl433adapter.js')
const Pms5003adapter = require('./pms5003adapter.js')
const Rtl433EventCache = require('./rtl433eventcache.js')
const SmartThingsAdapter = require('./smartthings-adapter.js')
const CloudwatchPublisher = require('./cloudwatch-publisher.js')
const ElectricityIntegrator = require('./electricity-integrator.js')
const express = require('express')
const path = require('path')

// ==== Express app
debug('starting')
const app = express()
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

const server = app.listen(app.get('port'), function () {
  debug('Server started on: http://localhost:' + app.get('port'))
  console.log('Server started on: http://localhost:' + app.get('port'))
})

// ==== Socket.io
const io = require('socket.io')(server)

/** websocket connection handler */
io.on('connection', function (socket) {
  debug('New client connected')

  eventCache.getEvents().forEach(function (event) {
    debug('sendng new client cached event: %o', event)
    socket.emit('sensor_event', event)
  })
})

// ==== input: RTL433 radio
const rtl433Options = { devices: [19, 33, 44] }
const rtl433 = new Rtl433adapter(rtl433Options)
rtl433.on('sensor_event', processEvent)

// ==== input: PMS5003 air-quality sensor
const pms5003Options = { serialdevice: '/dev/serial0' }
const pms5003 = new Pms5003adapter(pms5003Options)
pms5003.on('sensor_event', processEvent)

// ==== input: device readings from Samsung SmartThings cloud
const smartThingsAdapter = new SmartThingsAdapter()
smartThingsAdapter.on('sensor_event', processEvent)

// ==== input/output: read Electricity power readings, integrate, output energy used
const electricityIntegrator = new ElectricityIntegrator()
electricityIntegrator.on('sensor_event', processEvent)

// ==== output: cache event so web app can fetch last event for each sensor on page load
const eventCache = new Rtl433EventCache()

// ==== output: publish to AWS CloudWatch
const publisher = new CloudwatchPublisher()

/**
 * Process a sensor_event:
 * name identified sensors, cache, send to all connected websockets, publish to database
 * @param {object} event - event structure as output by rtl_433
 */
function processEvent (event) {
  // debug('processEvent (raw): %O', event)
  addNameToEvent(event)
  if (event.sensorName) {
    debug('processEvent: (named): %O', event)
    eventCache.store(event)
    io.emit('sensor_event', event)
    publisher.newEvent(event)
    electricityIntegrator.handleEvent(event)
  }
}

// our sensors - events from a model|id not listed here will get ignored
const sensorId2Name = {
  'SmartThings Temperature/Humidity|99': 'indoor',
  'Nexus-TH|152': 'garage',
  'WT450 sensor|1': 'outdoor',
  'CurrentCost-TX|2115': 'electricity',
  'ElectricityIntegrator|1': 'electricity_kwh_today',
  'pms5003|1': 'airquality'
}

/**
 * Add sensorName property to relevant events
 * @param {object} event - sensor event
 */
function addNameToEvent (event) {
  for (const sensorId in sensorId2Name) {
    const id = event.id || event.dev_id
    if (sensorId === event.model + '|' + id) {
      event.sensorName = sensorId2Name[sensorId]
    }
  }
}
