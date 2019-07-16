const EventEmitter = require('events').EventEmitter
const debug = require('debug')('webmon:electricityintegrator')
const moment = require('moment')

class ElectricityIntegrator extends EventEmitter {
  constructor () {
    debug('constructor()')
    super()
    this.kwh = 0
    this.lastReadingTime = null
    this.startedDate = moment().format('YYYY-MM-DD')
    this.startedAtBeginningOfDay = false
  }

  handleEvent (eventData) {
    // debug('handleEvent(): %o', eventData)
    if (eventData.sensorName === 'electricity') {
      const now = new Date()
      if (this.lastReadingTime) {
        // we've had a previous reading, calculate the additional energy used
        const durationHrs = (now - this.lastReadingTime) / 1000 / 60 / 60
        const additionalKwh = eventData.power0 / 1000 * durationHrs
        this.kwh += additionalKwh
      }
      this.lastReadingTime = now

      const today = moment().format('YYYY-MM-DD')
      if (this.startedDate !== today) {
        this.dayChanged()
      }

      this.emitKwhToday()
    }
  }

  /**
   * Do processing for a new day
   */
  dayChanged () {
    // emit sensor event for total, if it was a full day
    if (this.startedAtBeginningOfDay) {
      this.emitKwhForDay()
    }
    // reset
    this.kwh = 0
    this.startedAtBeginningOfDay = true
    this.startedDate = moment().format('YYYY-MM-DD')
  }

  /**
   * emit a sensor reading for the current total kwh used during this day
   */
  emitKwhToday () {
    const sensorEvent = {
      model: 'ElectricityIntegrator',
      id: '1',
      time: moment().format('YYYY-MM-DD HH:mm:ss'),
      day: this.startedDate,
      kwh_today: this.kwh
    }
    debug('handleEvent(): emitting %o', sensorEvent)
    this.emit('sensor_event', sensorEvent)
  }

  /**
   * emit a sensor reading for the total kwh used for the preceding day
   */
  emitKwhForDay () {
    const sensorEvent = {
      model: 'ElectricityIntegrator',
      id: '1',
      time: moment().format('YYYY-MM-DD HH:mm:ss'),
      day: this.startedDate,
      kwh_day_total: this.kwh
    }
    debug('handleEvent(): emitting %o', sensorEvent)
    this.emit('sensor_event', sensorEvent)
  }
}

module.exports = ElectricityIntegrator
