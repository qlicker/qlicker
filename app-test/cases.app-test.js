/* eslint-env mocha */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// routes.app-test.js: testing app navigation by routes

import { Meteor } from 'meteor/meteor'
import { expect } from 'meteor/practicalmeteor:chai'

import { generateData } from './../imports/api/generate-data.app-test.js'

import { Courses } from '../imports/api/courses'
import { Questions } from '../imports/api/questions'
import { Sessions } from '../imports/api/sessions'

import { waitForSubscriptions, afterFlushPromise, triggerChange } from './utils.app-test'

if (Meteor.isClient) {
  describe('cases', function () {
    this.timeout(2500)

    before((done) => {
      Router.go('/')
      generateData()
        .then(waitForSubscriptions)
        .then(done)
    })

    beforeEach((done) => {
      Meteor.logout()
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

      // TODO
      it('should deny on invalid login [T2 Invalid Login]')
      it('should allow user to create account [T3 Sign Up]')
      it('can create question [T10]')
      it('can view session in lecture mode [T12]')
      it('can do session as quiz [T15]')
      it('can view student results [T24]')
    })

    describe('student logged in', () => {
      before((done) => {
        Meteor.logout(() => {
          Router.go('/')
          afterFlushPromise().then(done)
        })
      })

      it('login should redirect to student dashboard [T1 Valid Login]', () => {
        Router.go('/login')

        return afterFlushPromise()
          .then(waitForSubscriptions)
          .then(() => {
            triggerChange('emailField', 'student@email.com')
            triggerChange('passwordField', 'p3ssw0rd')

            document.getElementById('submitButton').click()
          })
          .then(waitForSubscriptions)
          .then(() => {
            expect(Router.current().route.getName()).to.equal('student')
          })
      })

      it('can enroll in course [T7, T8]')
    })

    describe('professor logged in', () => {
      before((done) => {
        Meteor.logout(() => {
          Router.go('/')
          afterFlushPromise().then(done)
        })
      })

      it('login should redirect to professor dashboard [T1 Valid Login]', () => {
        Router.go('/login')

        return afterFlushPromise()
          .then(waitForSubscriptions)
          .then(() => {
            triggerChange('emailField', 'professor@email.com')
            triggerChange('passwordField', 'p3ssw0rd')

            document.getElementById('submitButton').click()
          })
          .then(waitForSubscriptions)
          .then(() => {
            expect(Router.current().route.getName()).to.equal('professor')
          })
      })

      // TODO
      it('can create course [T6]')
      it('can delete course')
      it('can edit course [T9]')
      it('can create question [T11]')
      it('can create session and add question [T18/19]')
      it('can start session in lecture mode [T13]')
      it('can view session as quiz [T14]')
      it('can make session live [T20]')
      it('can stop session [T21]')
      it('can view results of session [T22]')
      it('can view student results [T23]')
    }) // end describe('logged in'
  }) // end describe('cases'
}
