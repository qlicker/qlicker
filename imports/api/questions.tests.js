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
import { Questions } from './sessions'
import { createAndStubProfessor, sampleCourse } from './courses.tests'

import './users.js'

export const sampleQuestion = {

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

      })

    }) // end describe('methods')

  }) // end describe('Questions')
} // end Meteor.isServer
