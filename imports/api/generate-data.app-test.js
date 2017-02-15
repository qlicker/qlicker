// QLICKER
// Author: Enoch T <me@enocht.am>
//
// generate-data.app-test.js: create testing data for app tests
// This file will be auto-imported in the app-test context,
// ensuring the method is always available

import { Meteor } from 'meteor/meteor'
import { Factory } from 'meteor/dburles:factory'
import { resetDatabase } from 'meteor/xolvio:cleaner'
import { Random } from 'meteor/random'
import { _ } from 'meteor/underscore'

import { denodeify } from '../utils/denodeify'

Meteor.methods({
  generateFixtures () {
    resetDatabase()
  }
})

let generateData
if (Meteor.isClient) {
  // Create a second connection to the server to use to call
  // test data methods. We do this so there's no contention
  // with the currently tested user's connection.
  const testConnection = Meteor.connect(Meteor.absoluteUrl())

  generateData = denodeify((cb) => {
    testConnection.call('generateFixtures', cb)
  })
}

export { generateData }
