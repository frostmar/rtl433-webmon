'use strict'
const expect = require('chai').expect
const sinon = require('sinon')

const Rtl433adapter = require('../rtl433adapter.js')
const EventEmitter = require('events')

describe('rtl433adapter', function () {
  let adapter
  let fakeChildProcess
  let rtl433adapterSpawnChildStub

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
    let actualReading
    const expectedReading = {
      time: '2016-06-28 00:31:23',
      model: 'CurrentCost TX',
      dev: 2115,
      power0_W: 514,
      power1_W: 3,
      power2_W: 2
    }

    adapter.on('sensor_event', function (theReading) { actualReading = theReading })
    fakeChildProcess.stdout.emit('data', '{"time" : "2016-06-28 00:31:23", ')
    fakeChildProcess.stdout.emit('data', '"model" : "CurrentCost TX", "dev')
    fakeChildProcess.stdout.emit('data', '" : 2115, "power0_W" : 514, "power1_W" : 3, "power2_W" : 2}' + '\n')

    expect(actualReading).deep.equals(expectedReading)
  })
})
