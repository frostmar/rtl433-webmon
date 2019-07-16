'use strict'

const debug = require('debug')('webmon:pms5003adapter')
const EventEmitter = require('events').EventEmitter
const SerialPort = require('serialport')
const moment = require('moment')
const frameHeader = Buffer.from([0x42, 0x4d])

class Pms5003adapter extends EventEmitter {
  /**
   * Adapter for a Plantower PMS5003 air quality sensor (parsing data from a serial port).
   * This class is an EventEmitter: parses the sensor data and emits
   * 'sensor_event' messages
   * @constructor
   * @param {object} options
   * @param {string} options.serialdevice - device to read eg '/dev/serial0'
   */
  constructor (options) {
    super()
    debug('constructed with options: %o', options)
    let serialdata = Buffer.from([])

    const port = new SerialPort(options.serialdevice, { baudRate: 9600 })
    port.on('data', (newdata) => {
      debug(`serial data received: ${newdata.length} bytes`)
      serialdata = Buffer.concat([serialdata, newdata])
      const start = serialdata.indexOf(frameHeader)
      if (start > 0) {
        serialdata = serialdata.slice(start)
      }
      if (serialdata.length >= 32) {
        const frameBuffer = serialdata.slice(0, 32)
        serialdata = serialdata.slice(32)
        const frame = this.readFrame(frameBuffer)
        frame.time = moment().format('YYYY-MM-DD HH:mm:ss')
        frame.model = 'pms5003'
        frame.id = 1
        this.emit('sensor_event', frame)
      }
    })
  }

  /**
   * Read a Plantower PMS5003 air-quality sensor data packet
   * http://www.aqmd.gov/docs/default-source/aq-spec/resources-page/plantower-pms5003-manual_v2-3.pdf
   * @param {Buffer} buffer - data from serial port to parse
   * @returns {object} air quality data structure
   */
  readFrame (buffer) {
    debug('getPacket() entry')
    const frame = {
      framelength: buffer.readInt16BE(2),
      apm1: buffer.readInt16BE(4), // Data  1 refers to PM1.0 concentration unit μg/m3 (CF=1，standard particle)
      apm2_5: buffer.readInt16BE(6), // Data  2 refers to PM2.5 concentration unit μg/m3 (CF=1，standard particle)
      apm10: buffer.readInt16BE(8), // Data  3 refers to PM10  concentration unit μg/m3 (CF=1，standard particle)
      pm1: buffer.readInt16BE(10), // Data  4 refers to PM1.0 concentration unit μg/m3 (under atmospheric environment)
      pm2_5: buffer.readInt16BE(12), // Data  5 refers to PM2.5 concentration unit μg/m3 (under atmospheric environment)
      pm10: buffer.readInt16BE(14), // Data  6 refers to PM10  concentration unit μg/m3 (under atmospheric environment)
      gt0_3um: buffer.readInt16BE(16), // Data  7 indicates the number of particles with diameter beyond  0.3 um in 0.1 L of air
      gt0_5um: buffer.readInt16BE(18), // Data  8 indicates the number of particles with diameter beyond  0.5 um in 0.1 L of air
      gt1um: buffer.readInt16BE(20), // Data  9 indicates the number of particles with diameter beyond  1.0 um in 0.1 L of air
      gt2_5um: buffer.readInt16BE(22), // Data 10 indicates the number of particles with diameter beyond 2.5 um in 0.1 L of air
      gt5um: buffer.readInt16BE(24), // Data 11 indicates the number of particles with diameter beyond 5.0 um in 0.1 L of air
      gt10um: buffer.readInt16BE(26), // Data 12 indicates the number of particles with diameter beyond 10  um in 0.1 L of air
      data13_reserved: buffer.readInt16BE(28), // Data 13 reserved
      check: buffer.readInt16BE(30) // Data 14 Check code = Start character 1 + Start character 2 + Data 1... + Data 13
    }
    return frame
  }
}

module.exports = Pms5003adapter
