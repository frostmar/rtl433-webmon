'use strict'

/**
 * Cache of last event of each sensor
 * (identified by key made from model and an id field)
 * @constructor
 */
function Rtl433EventCache () {
  this.cache = {} // cache: <id> => <event>
};

/**
 * store an event
 * @param {object} newEvent - rtl433adapter event message
 */
Rtl433EventCache.prototype.store = function (newEvent) {
  const key = this.getEventKey(newEvent)
  this.cache[key] = newEvent
}

/**
 * @private
 * @param {object} event - rtl433adapter event message
 * @returns {string} key for the event
 */
Rtl433EventCache.prototype.getEventKey = function (event) {
  const id = event.id ? event.id : event.dev_id
  return event.model + '|' + id
}

/**
 * @return {object[]} array of stored events
 */
Rtl433EventCache.prototype.getEvents = function () {
  return Object.values(this.cache)
}

module.exports = Rtl433EventCache
