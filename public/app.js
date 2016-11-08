'use strict';


// debug logger
io().on('sensor_event', function (event) {
  console.log('websocket sensor_event', event);
});


// Angular app level module which depends on views, and components
var app = angular.module('rtl433webmon', [])


// Angular components

app.controller('SensorReading', function($scope) {

  var self = this;
  self.event = {};

  function init(){
    self.socket = io();
    self.socket.on('sensor_event', function (event) {
      if( event['dev_id'] &&
          event['dev_id'] === 2115 )
      {
        self.event = event;
        $scope.$apply();
      }
    });
  };
  init();

})
