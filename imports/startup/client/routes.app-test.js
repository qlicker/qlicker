/* eslint-env mocha */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// routes.app-test.js: testing app navigation by routes

import { Meteor } from 'meteor/meteor'

import { generateData } from './../../api/generate-data.app-test.js'

import { waitForSubscriptions } from '../../../app-test/utils.app-test'

if (Meteor.isClient) {
  describe('routes', function () {
    this.timeout(2500)

    before((done) => {
      Router.go('/')
      generateData()
        .then(waitForSubscriptions)
        .then(done)
    })

    beforeEach((done) => {
      // First, ensure the data that we expect is loaded on the server
      //   Then, route the app to the homepage
      Meteor.logout()
      // generateData().then(done)
      done()
    })

    describe('when logged out', () => {
      it('all redirect to login page')
    }) // end describe('logged in'
  }) // end describe('routes'
}
