const expect = require('chai').expect
const sinon = require('sinon')
const ElectricityIntegrator = require('../electricity-integrator.js')
const oneHourInMsec = 1000 * 60 * 60

describe('ElectricityIntegrator', () => {
  let electricityIntegrator
  beforeEach(function () {
    electricityIntegrator = new ElectricityIntegrator()
    this.clock = sinon.useFakeTimers()
  })
  afterEach(function () {
    this.clock.restore()
  })
  it('handles an electricity event, incrementing energy used', function () {
    const fakeElecEvent = {
      sensorName: 'electricity',
      power0: 100 // watts
    }
    electricityIntegrator.handleEvent(fakeElecEvent)
    this.clock.tick(oneHourInMsec)
    electricityIntegrator.handleEvent(fakeElecEvent)
    expect(electricityIntegrator.kwh).to.equal(0.1)
  })
})
