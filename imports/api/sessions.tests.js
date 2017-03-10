/* eslint-env mocha */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// Unit tests for session data maniupulation methods

import { Meteor } from 'meteor/meteor'
import { expect } from 'meteor/practicalmeteor:chai'

import { _ } from 'underscore'

import { restoreStubs } from '../../stubs.tests.js'


import { Courses } from './courses'
import { Questions } from './questions'
import { Sessions } from './sessions'
import { createAndStubProfessor, sampleCourse } from './courses.tests'
import { prepQuestionAndSession } from './questions.tests'

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
        const sessionFromDb = Sessions.find({ _id: courseFromDb.sessions[0] })
        expect(sessionFromDb.count()).to.equal(1)
      })

      it('can delete session (courses.deleteSession)', () => {
        const profUserId = createAndStubProfessor()
        const courseId = Meteor.call('courses.insert', _.extend({ owner: profUserId }, _.omit(sampleCourse, 'owner')))
        Meteor.call('courses.createSession', courseId, sampleSession)

        let courseFromDb = Courses.findOne({ _id: courseId })
        const sessionId = courseFromDb.sessions[0]

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
        Questions.remove({})
        Meteor.users.remove({})
        restoreStubs()
      })

      it('can edit session (session.edit)', () => {
        const profUserId = createAndStubProfessor()
        const courseId = Meteor.call('courses.insert', _.extend({ owner: profUserId }, _.omit(sampleCourse, 'owner')))
        Meteor.call('courses.createSession', courseId, sampleSession)

        let courseFromDb = Courses.findOne({ _id: courseId })
        const sessionId = courseFromDb.sessions[0]
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

      it('can add question to session (session.addQuestion)', () => {
        prepQuestionAndSession((sessionId, questionId) => {
          Meteor.call('sessions.addQuestion', sessionId, questionId)

          const sessionFromDb = Sessions.findOne({ _id: sessionId })
          expect(sessionFromDb.questions.length).to.equal(1)
          expect(sessionFromDb.questions[0]).to.equal(questionId)
        })
      })

      it('can remove question to session (session.removeQuestion)', () => {
        prepQuestionAndSession((sessionId, questionId) => {
          Meteor.call('sessions.addQuestion', sessionId, questionId)
          Meteor.call('sessions.removeQuestion', sessionId, questionId)

          const sessionFromDb = Sessions.findOne({ _id: sessionId })
          expect(sessionFromDb.questions.length).to.equal(0)
        })
      })

      it('can batch edit question list (sessions.batchEdit)', () => {
        prepQuestionAndSession((sessionId, questionId) => {
          // use 3 of the same questions for testing. (ids will be different)
          Meteor.call('questions.copyToSession', sessionId, questionId)
          Meteor.call('questions.copyToSession', sessionId, questionId)
          Meteor.call('questions.copyToSession', sessionId, questionId)

          const originalQlist = Sessions.findOne({ _id: sessionId }).questions

          const shuffled = _(originalQlist).shuffle()
          Meteor.call('sessions.batchEdit', sessionId, shuffled)
          expect(shuffled).to.deep.equal(Sessions.findOne({ _id: sessionId }).questions)
        })
      })

      it('can start session and end session (sessions.startSession & sessions.endSession)', () => {
        prepQuestionAndSession((sessionId, questionId) => {
          Meteor.call('questions.copyToSession', sessionId, questionId)
          Meteor.call('questions.copyToSession', sessionId, questionId)

          const firstQuestionId = Sessions.findOne({ _id: sessionId }).questions[0]

          Meteor.call('sessions.startSession', sessionId)

          const sessionFromDb1 = Sessions.findOne(sessionId)
          expect(sessionFromDb1.currentQuestion).to.equal(firstQuestionId)

          const questionBeforeEnd = sessionFromDb1.currentQuestion
          Meteor.call('sessions.endSession', sessionId)

          const sessionFromDb2 = Sessions.findOne(sessionId)
          expect(sessionFromDb2.status).to.equal('done')
          expect(sessionFromDb2.currentQuestion).to.equal(questionBeforeEnd)
        })
      })

      it('can set current question (sessions.setCurrent)', () => {
        prepQuestionAndSession((sessionId, questionId) => {
          // use 3 of the same questions for testing. (ids will be different)
          Meteor.call('questions.copyToSession', sessionId, questionId)
          Meteor.call('questions.copyToSession', sessionId, questionId)
          Meteor.call('questions.copyToSession', sessionId, questionId)

          const qList = Sessions.findOne({ _id: sessionId }).questions

          expect(Sessions.findOne(sessionId).currentQuestion).to.be.undefined

          Meteor.call('sessions.startSession', sessionId)
          Meteor.call('sessions.setCurrent', sessionId, qList[0])
          expect(Sessions.findOne(sessionId).currentQuestion).to.equal(qList[0])
          Meteor.call('sessions.setCurrent', sessionId, qList[1])
          expect(Sessions.findOne(sessionId).currentQuestion).to.equal(qList[1])
          Meteor.call('sessions.setCurrent', sessionId, qList[2])
          expect(Sessions.findOne(sessionId).currentQuestion).to.equal(qList[2])
        })
      })
    })// end describe('methods')
  }) // end describe('Sessions')
} // end Meteor.isServer
