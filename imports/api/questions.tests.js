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
import { Questions } from './questions'
import { createAndStubProfessor, sampleCourse } from './courses.tests'
import { sampleSession } from './sessions.tests'

import './users.js'

const exContentState = '{"entityMap":{},"blocks":[{"key":"deval","text":"New Question","type":"header-one","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}]}'

export const sampleQuestion = {
  question: 'Test question?',
  content: exContentState,
  answers: [{ answer: 'A', content: exContentState }],
  submittedBy: '',
  tags: []
}

export const prepQuestionAndSession = (assertion) => {
  const profUserId = createAndStubProfessor()
  const courseId = Meteor.call('courses.insert', _.extend({ owner: profUserId }, _.omit(sampleCourse, 'owner')))
  const sessionId = Meteor.call('courses.createSession', courseId, sampleSession)
  const questionId = Meteor.call('questions.insert', sampleQuestion)

  assertion(sessionId, questionId)
}


if (Meteor.isServer) {
  describe('Questions', () => {
    describe('methods', () => {
      beforeEach(() => {
        Courses.remove({})
        Sessions.remove({})
        Questions.remove({})
        Meteor.users.remove({})
        restoreStubs()
      })

      it('can create question (questions.insert)', () => {
        prepQuestionAndSession((_, questionId) => {
          const questionFromDb = Questions.find({ _id: questionId }).fetch()
          expect(questionFromDb.length).to.equal(1)
          expect(questionFromDb[0].content).to.equal(sampleQuestion.content)
        })
      })
    }) // end describe('methods')
  }) // end describe('Questions')
} // end Meteor.isServer
