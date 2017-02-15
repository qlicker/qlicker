/* eslint-env mocha */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// routes.app-test.js: testing app navigation by routes

import { Meteor } from 'meteor/meteor'
import { Tracker } from 'meteor/tracker'
import { DDP } from 'meteor/ddp-client'
import { Promise } from 'meteor/promise'
import { expect } from 'meteor/practicalmeteor:chai'
import { $ } from 'meteor/jquery'

import { denodeify } from '../../utils/denodeify'
import { generateData } from './../../api/generate-data.app-test.js'

import { Courses } from '../../api/courses'
import { Questions } from '../../api/questions'
import { Sessions } from '../../api/sessions'

// Utility -- returns a promise which resolves when all subscriptions are done
const waitForSubscriptions = () => new Promise(resolve => {
  const poll = Meteor.setInterval(() => {
    if (DDP._allSubscriptionsReady()) {
      Meteor.clearInterval(poll)
      resolve()
    }
  }, 200)
})

// Tracker.afterFlush runs code when all consequent of a tracker based change
//   (such as a route change) have occured. This makes it a promise.
const afterFlushPromise = denodeify(Tracker.afterFlush)

if (Meteor.isClient) {
  describe('routes', () => {
    beforeEach(() => {
      // First, ensure the data that we expect is loaded on the server
      //   Then, route the app to the homepage
      Meteor.logout()
      generateData()
        .then(() => Router.go('/'))
        .then(waitForSubscriptions)
    })

    describe('when logged out', () => {
      it('no data available', () => {
        const courses = Courses.find({}).fetch()
        const sessions = Sessions.find({}).fetch()
        const users = Meteor.users.find({}).fetch()
        const questions = Questions.find({}).fetch()

        return afterFlushPromise()
          .then(waitForSubscriptions)
          .then(() => {
            expect(courses).to.have.length(0)
            expect(sessions).to.have.length(0)
            expect(users).to.have.length(0)
            expect(questions).to.have.length(0)
          })
      })
    })
  })
}
