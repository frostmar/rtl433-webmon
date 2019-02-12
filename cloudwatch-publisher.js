const debug = require('debug')('webmon:publisher')
const AWS = require('aws-sdk')
AWS.config.update(AWS.config.loadFromPath('./secret_config/aws-config.json'))

/**
 * Class to publish sensor readings to Amazon Cloudwatch as custom metrics
 */
class CloudwatchPublisher {
  /**
   * constructor
   */
  constructor () {
    debug('constructing')
    const PUBLISH_INTERVAL_MSEC = 5 * 60 * 1000
    this.pendingReadings = {}
    this.cloudwatch = new AWS.CloudWatch()

    this.sensorId2Name = {
      150: 'garage',
      1: 'outdoor'
    }

    // this.sendReadings() // !!todo: remove (send immendiately for testing only)
    setInterval(this.sendReadings.bind(this), PUBLISH_INTERVAL_MSEC)
  }

  /**
   * consume a sensor reading
   * event - {object} sensor event
   */
  newEvent (event) {
    // debug('newEvent()', JSON.stringify(event))

    if (event.pm2_5) {
      // air quality
      this.pendingReadings['airquality/pm2.5'] = event.pm2_5
    }
    if (event.power0) {
      // power meter
      this.pendingReadings['electricity/power'] = event.power0
    }
    if (event.temperature_C) {
      // temperature
      const sensorName = this.sensorId2Name[event.id]
      if (sensorName) {
        this.pendingReadings['temperature/' + sensorName] = event.temperature_C
      }
    }
    if (event.humidity) {
      // humidity
      const sensorName = this.sensorId2Name[event.id]
      if (sensorName) {
        this.pendingReadings['humidity/' + sensorName] = event.humidity
      }
    }
  }

  /**
   * Send readings to Amazon CloudWatch
   */
  sendReadings () {
    debug('sendReadings(): pendingReadings: ', JSON.stringify(this.pendingReadings))

    for (const metricName in this.pendingReadings) {
      const metricValue = this.pendingReadings[metricName]
      const putMetricParams = {
        Namespace: 'house',
        MetricData: [
          {
            MetricName: metricName,
            Value: metricValue,
            StorageResolution: 60
          }
        ]
      }
      this.cloudwatch.putMetricData(putMetricParams, (err, data) => {
        if (err) console.log('Error putting data to CloudWatch: ' + err, err.stack)
        else console.log('Put data to CloudWatch OK: ' + JSON.stringify(data))
      })
    }

    this.pendingReadings = {}
  }
}

module.exports = CloudwatchPublisher
