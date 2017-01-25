/* eslint-env mocha */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// Unit tests for session data maniupulation methods

import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { expect } from 'meteor/practicalmeteor:chai'

import { _ } from 'underscore'

import { createStubs, restoreStubs } from '../../stubs.tests.js'

import { Courses } from './courses.js'
import './users.js'

if (Meteor.isServer) {
  describe('Sessions', () => {
    // const userId = Random.id()

    // const sampleSession = {

    // }
    describe('methods', () => {
      beforeEach(() => {
        Courses.remove({})
        Meteor.users.remove({})
        restoreStubs()
      })


      // it('can delete session (session.delete)', () => {

      // })

      // it('can edit session (session.edit)', () => {

      // })
    })// end describe('methods')
  }) // end describe('Sessions')
} // end Meteor.isServer
