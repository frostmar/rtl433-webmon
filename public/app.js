'use strict'

// Angular app level module which depends on views, and components
var app = angular.module('rtl433webmon', [])

// Angular service holding sensor data (from websocket)
app.service('SensorDataService', function ($rootScope) {
  var self = this
  self.sensordata = {
    CurrentCost: {},
    Temperature: {}
  }

  self.socket = io.connect()
  self.socket.on('sensor_event', function (event) {
    // debug logging
    console.log('websocket sensor_event', event)

    if (event.model === 'CurrentCost TX') {
      // power sensor
      self.sensordata.CurrentCost[event.dev_id] = event
    } else if (event.model === 'Nexus Temperature/Humidity' || event.model === 'WT450 sensor') {
      // temperature/humidity sensor
      self.sensordata.Temperature[event.id] = event
    } else if (event.model === 'pms5003') {
      // air quality sensor
      self.sensordata.airQuality = event
    }
    $rootScope.$digest()
  })

  /**
   * get data object for a particular temperature sensor
   * @returns {object}
   */
  self.getTemperatureSensorData = function (deviceId) {
    return self.sensordata.Temperature[deviceId]
  }

  /**
   * get data object for a particular temperature sensor
   * @returns {object}
   */
  self.getPowerSensorData = function (deviceId) {
    return self.sensordata.CurrentCost[deviceId]
  }

  /**
   * get data object for a particular temperature sensor
   * @returns {object}
   */
  self.getAirQualitySensorData = function (deviceId) {
    return self.sensordata.airQuality
  }
})

/// ///////////////////////////////
// Angular components

app.component('temperatureDisplay', {
  templateUrl: 'temperatureDisplay.html',
  controller: TemperatureDisplayController,
  bindings: {
    deviceid: '<',
    temperatureOffset: '<'
  }
})

function TemperatureDisplayController ($scope, SensorDataService) {
  var ctrl = this
  ctrl.temperature_C = undefined
  ctrl.temperatureOffset = ctrl.temperatureOffset ? ctrl.temperatureOffset : 0
  ctrl.humidity = undefined

  $scope.$watch(watchFunction, onDataChange)

  function watchFunction () {
    return SensorDataService.getTemperatureSensorData(ctrl.deviceid)
  }

  function onDataChange (newValue, oldValue) {
    console.log('TemperatureDisplayController onDataChange for deviceid=' + ctrl.deviceid)
    if (newValue) {
      ctrl.temperature_C = newValue.temperature_C + ctrl.temperatureOffset
      ctrl.humidity = newValue.humidity
      ctrl.lowbattery = (newValue.battery === 'LOW')
      ctrl.time = newValue.time
      ctrl.sensorName = newValue.sensorName
    }
  }
}

/// ///////////////////////////////

app.component('powerDisplay', {
  templateUrl: 'powerDisplay.html',
  controller: PowerDisplayController,
  bindings: {
    deviceid: '<'
  }
})

function PowerDisplayController ($scope, SensorDataService) {
  var ctrl = this
  ctrl.power = undefined

  $scope.$watch(watchFunction, onDataChange)

  function watchFunction () {
    return SensorDataService.getPowerSensorData(ctrl.deviceid)
  }

  function onDataChange (newValue, oldValue) {
    console.log('PowerDisplayController onDataChange for deviceid=' + ctrl.deviceid)
    if (newValue) {
      ctrl.power = newValue.power0
      ctrl.time = newValue.time
    }
  }
}

/// ///////////////////////////////

app.component('airQualityDisplay', {
  templateUrl: 'airQualityDisplay.html',
  controller: AirQualityDisplayController,
  bindings: {}
})

function AirQualityDisplayController ($scope, SensorDataService) {
  var ctrl = this
  ctrl.pm10 = undefined

  $scope.$watch(watchFunction, onDataChange)

  function watchFunction () {
    return SensorDataService.getAirQualitySensorData()
  }

  function onDataChange (newValue, oldValue) {
    console.log('AirQualityDisplayController onDataChange for pms5003')
    if (newValue) {
      ctrl.pm2_5 = newValue.pm2_5
      ctrl.pm10 = newValue.pm10
      ctrl.time = newValue.time
    }
  }
}
