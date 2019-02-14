const EventEmitter = require('events').EventEmitter
const debug = require('debug')('webmon:smartthings-adapter')
const request = require('request-promise-native')
const moment = require('moment')
const smartthingsConfig = require('./secret_config/smartthings-config.json')
const smartthingsBaseUrl = 'https://api.smartthings.com/v1'

const humidityDevId = 'd142b6c5-977b-44a9-9dc9-b8f1ba898d3e'

class SmartThingsAdapter extends EventEmitter {
  constructor () {
    const POLL_RATE_MSEC = 30 * 1000
    super()

    if (!smartthingsConfig.accessToken) {
      throw new Error('SmartThings accessToken not defined in config')
    }

    setInterval(this.getReading.bind(this), POLL_RATE_MSEC)
  }

  async getReading () {
    const tempHumidity = await this.getTemperatureAndHumidity()
    const event = {
      model: 'SmartThings Temperature/Humidity',
      id: 99,
      time: moment().format('YYYY-MM-DD HH:mm:ss'),
      temperature_C: tempHumidity.temp,
      humidity: tempHumidity.humidity,
      battery: 'OK'
    }
    this.emit('sensor_event', event)
  }

  /**
   * Fetch smartthings humidity sensor reading
   * @returns {Promise<{temp: number, humidity: number>}
   */
  async getTemperatureAndHumidity () {
    const options = {
      uri: `${smartthingsBaseUrl}/devices/${humidityDevId}/status`,
      auth: { bearer: smartthingsConfig.accessToken },
      json: true
    }

    return request(options)
      .then((response) => {
        debug('getTemperatureAndHumidity(): response\n %O', response)
        return {
          temp: response.components.main.temperatureMeasurement.temperature.value,
          humidity: response.components.main.relativeHumidityMeasurement.humidity.value
        }
      })
      .catch((err) => {
        debug('getTemperatureAndHumidity(): error fetching humidity sensor reading from smartthings api: ' + err)
      })
  }
}

module.exports = SmartThingsAdapter
