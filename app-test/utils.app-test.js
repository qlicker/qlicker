/* eslint-env mocha */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// utils.app-test.js: util promises and methods to aide in full app testing

import { Meteor } from 'meteor/meteor'
import { Tracker } from 'meteor/tracker'
import { DDP } from 'meteor/ddp-client'
import { Promise } from 'meteor/promise'
import { expect } from 'meteor/practicalmeteor:chai'
import { $ } from 'meteor/jquery'

import { denodeify } from '../imports/utils/denodeify'
import { generateData } from '../imports/api/generate-data.app-test.js'


// Utility -- returns a promise which resolves when all subscriptions are done
export const waitForSubscriptions = () => new Promise(resolve => {
  const poll = Meteor.setInterval(() => {
    if (DDP._allSubscriptionsReady()) {
      Meteor.clearInterval(poll)
      resolve()
    }
  }, 200)
})

// Tracker.afterFlush runs code when all consequent of a tracker based change
//   (such as a route change) have occured. This makes it a promise.
export const afterFlushPromise = denodeify(Tracker.afterFlush)

export const triggerChange = (id, value) => {
  const element = document.getElementById(id)
  element.value = value
  element.dispatchEvent(new Event('input', { bubbles: true }))
}
