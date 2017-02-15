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

const triggerChange = (id, value) => {
  const element = document.getElementById(id)
  element.value = value
  element.dispatchEvent(new Event('input', { bubbles: true }))
}

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
      it('should have no data available', (done) => {
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
            done()
          })
      })
    })

    describe('student logged in', () => {
      before((done) => {
        Meteor.logout(() => {
          Router.go('/')
          afterFlushPromise().then(done)
        })
      })

      it('should redirect to student dashboard', () => {
        Router.go('/login')

        return afterFlushPromise()
          .then(waitForSubscriptions)
          .then(() => {
            triggerChange('emailField', 'student@email.com')
            triggerChange('passwordField', 'p3ssw0rd')

            $('#submitButton').click()
          })
          .then(waitForSubscriptions)
          .then(() => {
            expect(Router.current().route.getName()).to.equal('student')
          })
      })
    })

    describe('professor logged in', () => {
      before((done) => {
        Meteor.logout(() => {
          Router.go('/')
          afterFlushPromise().then(done)
        })
      })

      it('should redirect to professor dashboard', () => {
        Router.go('/login')

        return afterFlushPromise()
          .then(waitForSubscriptions)
          .then(() => {
            triggerChange('emailField', 'professor@email.com')
            triggerChange('passwordField', 'p3ssw0rd')

            $('#submitButton').click()
          })
          .then(waitForSubscriptions)
          .then(() => {
            expect(Router.current().route.getName()).to.equal('professor')
          })
      })

      it('can create course')
      it('can delete course')
      it('can create question')
      it('can create session and add question')
    }) // end describe('logged in'
  }) // end describe('routes'
}
