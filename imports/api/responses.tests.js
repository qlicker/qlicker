/* eslint-env mocha */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// Unit tests for answer data maniupulation methods

import { Meteor } from 'meteor/meteor'
import { restoreStubs } from '../../stubs.tests.js'

import { Courses } from './courses.js'
import { Sessions } from './sessions'
import { Questions } from './questions'
import './users.js'

if (Meteor.isServer) {
  describe('Answers', () => {
    describe('methods', () => {
      beforeEach(() => {
        Courses.remove({})
        Sessions.remove({})
        Questions.remove({})
        Meteor.users.remove({})
        restoreStubs()
      })

      it('student can submit answer (answer.addQuestionAnswer)')
      it('student can update answer (answer.update)')
    }) // end describe('methods')
  }) // end describe('Courses')
} // end Meteor.isServer
