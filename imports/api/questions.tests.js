/* eslint-env mocha */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// Unit tests for session data maniupulation methods

import { Meteor } from 'meteor/meteor'
import { expect } from 'meteor/practicalmeteor:chai'

import { _ } from 'underscore'


import { restoreStubs, createStubs } from '../../stubs.tests.js'

import { Courses, Course } from './courses.js'
import { Sessions } from './sessions'
import { Questions } from './questions'
import { createAndStubProfessor, sampleCourse, prepStudentCourse } from './courses.tests'
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
  sampleQuestion.courseId = courseId
  const questionId = Meteor.call('questions.insert', sampleQuestion)

  assertion(sessionId, questionId, courseId)
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

      it('can get tags as prof (questions.possibleTags)', () => {
        const profUserId = createAndStubProfessor()
        Meteor.call('courses.insert', _.extend({ owner: profUserId }, _.omit(sampleCourse, 'owner')))
        const tags = Meteor.call('questions.possibleTags')
        expect(tags).to.contain((new Course(sampleCourse)).courseCode())
      })

      it('can get tags as student (questions.possibleTags)', () => {
        prepStudentCourse((courseId, studentUserId) => { // TODO
          Meteor.call('courses.addStudent', courseId, studentUserId)
          restoreStubs()
          createStubs(studentUserId)

          const tags = Meteor.call('questions.possibleTags')
          expect(tags).to.contain((new Course(sampleCourse)).courseCode())
        })
      })

      it('can add/remove tag (questions .addTag, .removeTag)', () => {
        prepQuestionAndSession((_, questionId, courseId) => {
          const tag = 'CISC498'
          Meteor.call('questions.addTag', questionId, tag)
          expect(Questions.findOne({ _id: questionId }).tags).to.contain(tag)

          Meteor.call('questions.removeTag', questionId, tag)
          expect(Questions.findOne({ _id: questionId }).tags.length).to.equal(0)
        })
      })
    }) // end describe('methods')
  }) // end describe('Questions')
} // end Meteor.isServer
