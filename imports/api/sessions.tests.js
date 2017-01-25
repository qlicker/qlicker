/* eslint-env mocha */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// Unit tests for session data maniupulation methods

import { Meteor } from 'meteor/meteor'
import { expect } from 'meteor/practicalmeteor:chai'

import { _ } from 'underscore'

import { restoreStubs } from '../../stubs.tests.js'

import { Courses } from './courses.js'
import { Sessions } from './sessions'
import { createAndStubProfessor, sampleCourse } from './courses.tests'

import './users.js'

export const sampleSession = {
  name: 'Session name',
  description: 'Session description',
  courseId: '',
  quiz: false,
  createdAt: new Date()
}

if (Meteor.isServer) {
  describe('Sessions', () => {
    describe('course<=>session methods', () => {
      beforeEach(() => {
        Courses.remove({})
        Sessions.remove({})
        Meteor.users.remove({})
        restoreStubs()
      })

      it('can create session (courses.createSession)', () => {
        const profUserId = createAndStubProfessor()
        const courseId = Meteor.call('courses.insert', _.extend({ owner: profUserId }, _.omit(sampleCourse, 'owner')))
        Meteor.call('courses.createSession', courseId, sampleSession)  // method test

        const courseFromDb = Courses.findOne({ _id: courseId })
        const sessionFromDb = Sessions.find({ _id: courseFromDb.sessions[0].sessionId })
        expect(sessionFromDb.count()).to.equal(1)
      })

      it('can delete session (courses.deleteSession)', () => {
        const profUserId = createAndStubProfessor()
        const courseId = Meteor.call('courses.insert', _.extend({ owner: profUserId }, _.omit(sampleCourse, 'owner')))
        Meteor.call('courses.createSession', courseId, sampleSession)

        let courseFromDb = Courses.findOne({ _id: courseId })
        const sessionId = courseFromDb.sessions[0].sessionId

        Meteor.call('courses.deleteSession', courseId, sessionId)  // method test
        
        courseFromDb = Courses.findOne({ _id: courseId })
        const sessionFromDb = Sessions.find({ _id: sessionId })
        expect(courseFromDb.sessions.length).to.equal(0)
        expect(sessionFromDb.count()).to.equal(0)
      })
    }) // end describe('course<=>session methods')

    describe('methods', () => {
      beforeEach(() => {
        Courses.remove({})
        Sessions.remove({})
        Meteor.users.remove({})
        restoreStubs()
      })

      it('can edit session (session.edit)', () => {
        const profUserId = createAndStubProfessor()
        const courseId = Meteor.call('courses.insert', _.extend({ owner: profUserId }, _.omit(sampleCourse, 'owner')))
        Meteor.call('courses.createSession', courseId, sampleSession)

        let courseFromDb = Courses.findOne({ _id: courseId })
        const sessionId = courseFromDb.sessions[0].sessionId
        const oldSession = Sessions.findOne({ _id: sessionId })

        // edit all the props that are elegible to be edited
        const editedSession = _.extend({}, oldSession)
        editedSession.name = 'name edited'
        editedSession.description = 'description edited'
        editedSession.status = 'visible' // hidden -> visible
        editedSession.quiz = true // false -> true
        editedSession.dueDate = new Date() // undefined -> new Date()

        Meteor.call('sessions.edit', editedSession) // method test
        
        // verify edits stuck
        const sessionFromDb = Sessions.findOne({ _id: sessionId })
        expect(sessionFromDb.name).to.equal(editedSession.name)
        expect(sessionFromDb.description).to.equal(editedSession.description)
        expect(sessionFromDb.status).to.equal(editedSession.status)
        expect(sessionFromDb.quiz).to.equal(editedSession.quiz)
        expect(sessionFromDb.dueDate.toString()).to.equal(editedSession.dueDate.toString())
      })
    })// end describe('methods')
  }) // end describe('Sessions')
} // end Meteor.isServer
