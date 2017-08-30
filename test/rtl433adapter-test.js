'use strict'
const expect = require('chai').expect
const sinon = require('sinon')

const Rtl433adapter = require('../rtl433adapter.js')
const EventEmitter = require('events')

describe('rtl433adapter', function () {
  var adapter
  var fakeChildProcess
  var rtl433adapterSpawnChildStub

  beforeEach(function () {
    fakeChildProcess = {}
    fakeChildProcess.stdout = new EventEmitter()
    rtl433adapterSpawnChildStub = sinon.stub(Rtl433adapter.prototype, 'spawnChild').returns(fakeChildProcess)
    adapter = new Rtl433adapter()
  })

  afterEach(function () {
    rtl433adapterSpawnChildStub.restore()
  })

  it('accumulates stdout data events and emits JSON sensor_event', function () {
    var actualReading
    var expectedReading = {
      'time': '2016-06-28 00:31:23',
      'model': 'CurrentCost TX',
      'dev_id': 2115,
      'power0': 514,
      'power1': 3,
      'power2': 2
    }

    adapter.on('sensor_event', function (theReading) { actualReading = theReading })
    fakeChildProcess.stdout.emit('data', '{"time" : "2016-06-28 00:31:23", ')
    fakeChildProcess.stdout.emit('data', '"model" : "CurrentCost TX", "dev_')
    fakeChildProcess.stdout.emit('data', 'id" : 2115, "power0" : 514, "power1" : 3, "power2" : 2}' + '\n')

    expect(actualReading).deep.equals(expectedReading)
  })
})
