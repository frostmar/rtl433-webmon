'use strict'

const debug = require('debug')('webmon:rtl433adapter')
const EventEmitter = require('events').EventEmitter
const spawn = require('child_process').spawn

class Rtl433adapter extends EventEmitter {
  /**
   * Adapter for a rtl433 child process (decoding 433MHz radio device messages).
   * This class is an EventEmitter: parses the child process's stdout and emits
   * 'sensor_event' messages
   * @constructor
   * @param {object}   options
   * @param {Number[]} options.devices - rtl_433 device numbers (-R parameters) to listen for
   */
  constructor (options) {
    super()
    let lineBuffer = ''
    this.options = options
    debug('constructed with options: %o', options)

    // spawn child process
    this.childProcess = this.spawnChild()
    this.childProcess.stdout.on('data', (data) => {
      debug('rtl433 data received: ' + data)
      lineBuffer += data
      const newlinePos = lineBuffer.indexOf('\n')
      if (newlinePos !== -1) {
        const readingString = lineBuffer.substring(0, newlinePos)
        lineBuffer = lineBuffer.substring(newlinePos + 1)
        const reading = JSON.parse(readingString)
        this.emit('sensor_event', reading)
      }
    })
  }

  /**
   * spawn a child process
   * @private
   * @returns {ChildProcess}
   */
  spawnChild () {
    const args = ['-F', 'json']
    this.options.devices.forEach((device) => { args.push('-R'); args.push(device) })
    debug('spawning rtl_433 with args: ', args)
    return spawn('rtl_433', args)
  }
}

module.exports = Rtl433adapter
