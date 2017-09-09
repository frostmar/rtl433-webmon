'use strict'

class Rtl433EventCache {
  /**
   * Cache of last event of each sensor
   * (identified by key made from model and an id field)
   * @constructor
   */
  constructor () {
    this.cache = {} // cache: <id> => <event>
  };

  /**
   * store an event
   * @param {object} newEvent - rtl433adapter event message
   */
  store (newEvent) {
    const key = this.getEventKey(newEvent)
    this.cache[key] = newEvent
  }

  /**
   * @private
   * @param {object} event - rtl433adapter event message
   * @returns {string} key for the event
   */
  getEventKey (event) {
    const id = event.id ? event.id : event.dev_id
    return event.model + '|' + id
  }

  /**
   * @return {object[]} array of stored events
   */
  getEvents () {
    return Object.values(this.cache)
  }
}

module.exports = Rtl433EventCache
