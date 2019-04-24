const debug = require('debug')('webmon:cloudwatchpublisher')
const AWS = require('aws-sdk')
AWS.config.update(AWS.config.loadFromPath('./secret_config/aws-config.json'))

/**
 * class to collect values to publish as a statistics set
 * computes the min/max/average
 */
class MetricsSet {
  constructor () {
    this.count = 0
    this.min = Number.POSITIVE_INFINITY
    this.max = Number.NEGATIVE_INFINITY
    this.sum = 0
  }

  addMetric (value) {
    this.count++
    this.min = Math.min(this.min, value)
    this.max = Math.max(this.max, value)
    this.sum += value
  }

  getStatisticsValues () {
    debug('getStatisticsValues returning %O', this)
    return {
      Maximum: this.max,
      Minimum: this.min,
      SampleCount: this.count,
      Sum: this.sum
    }
  }
}

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

    // this.sendReadings() // (send immendiately for testing only)
    setInterval(this.sendReadings.bind(this), PUBLISH_INTERVAL_MSEC)
  }

  /**
   * consume a sensor reading
   * event - {object} sensor event
   */
  newEvent (event) {
    // debug('newEvent() %O', event)

    if (event.pm2_5) {
      // air quality
      if (!this.pendingReadings['airquality/pm2.5']) {
        this.pendingReadings['airquality/pm2.5'] = new MetricsSet()
      }
      this.pendingReadings['airquality/pm2.5'].addMetric(event.pm2_5)
    }
    if (event.power0) {
      // power meter
      if (!this.pendingReadings['electricity/power']) {
        this.pendingReadings['electricity/power'] = new MetricsSet()
      }
      this.pendingReadings['electricity/power'].addMetric(event.power0)
    }
    if (event.temperature_C) {
      // temperature
      if (!this.pendingReadings['temperature/' + event.sensorName]) {
        this.pendingReadings['temperature/' + event.sensorName] = new MetricsSet()
      }
      this.pendingReadings['temperature/' + event.sensorName].addMetric(event.temperature_C)
    }
    if (event.humidity) {
      // humidity
      if (!this.pendingReadings['humidity/' + event.sensorName]) {
        this.pendingReadings['humidity/' + event.sensorName] = new MetricsSet()
      }
      this.pendingReadings['humidity/' + event.sensorName].addMetric(event.humidity)
    }
  }

  /**
   * Send readings to Amazon CloudWatch
   */
  sendReadings () {
    debug('sendReadings(): pendingReadings: %O', this.pendingReadings)

    for (const metricName in this.pendingReadings) {
      const metricSet = this.pendingReadings[metricName]
      const putMetricParams = {
        Namespace: 'house',
        MetricData: [
          {
            MetricName: metricName,
            StatisticValues: metricSet.getStatisticsValues(),
            StorageResolution: 60
          }
        ]
      }
      this.cloudwatch.putMetricData(putMetricParams, (err, data) => {
        if (err) debug('Error putting data to CloudWatch: ' + err, err.stack)
        else debug('Put data to CloudWatch OK: ' + JSON.stringify(data))
      })
    }

    this.pendingReadings = {}
  }
}

module.exports = CloudwatchPublisher
