const EventEmitter = require('events').EventEmitter
const debug = require('debug')('webmon:electricityintegrator')
const moment = require('moment')

class ElectricityIntegrator extends EventEmitter {
  constructor () {
    debug('constructor()')
    super()
    this.kwh = 0
    this.lastReadingTime = null
    // todo: setTimeout(this.emitUsage)
  }

  handleEvent (eventData) {
    // debug('handleEvent(): %o', eventData)
    if (eventData.sensorName === 'electricity') {
      const now = new Date()
      if (this.lastReadingTime) {
        // we've had a previous reading, calculate the additional energy used
        let durationHrs = (now - this.lastReadingTime) / 1000 / 60 / 60
        let additionalKwh = eventData.power0 / 1000 * durationHrs
        this.kwh += additionalKwh
      }

      this.lastReadingTime = now
      const sensorEvent = {
        model: 'ElectricityIntegrator',
        id: '1',
        time: moment().format('YYYY-MM-DD HH:mm:ss'),
        kwh_today: this.kwh
      }
      debug('handleEvent(): emitting %o', sensorEvent)
      this.emit('sensor_event', sensorEvent)
    }
  }
}

module.exports = ElectricityIntegrator
