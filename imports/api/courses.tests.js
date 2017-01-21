/* eslint-env mocha */

import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { expect } from 'meteor/practicalmeteor:chai'

import { _ } from 'underscore'

import { Courses } from './courses.js'

if (Meteor.isServer) {
  // TODO Stub Meteor user

  describe('Courses', () => {
    describe('methods', () => {
      const userId = Random.id()

      const sampleCourse = {
        createdAt: new Date(),
        owner: userId,
        name: 'Intro to Computer Science',
        deptCode: 'CISC',
        courseNumber: '101',
        section: '001',
        semester: 'F17'
      }

      beforeEach(() => {
        Courses.remove({})
      })

      it('can insert new course (courses.insert)', () => {
        let courseId = Meteor.call('courses.insert', _.extend({}, sampleCourse))

        expect(Courses.find({ _id: courseId }).count()).to.equal(1)
      })

      it('can delete course (courses.delete)', () => {
        let courseId = Meteor.call('courses.insert', _.extend({}, sampleCourse))

        Meteor.call('courses.delete', courseId)
        expect(Courses.find({ _id: courseId }).count()).to.equal(0)
      })

      it('can regenerate code (courses.regenerateCode)', () => {
        const courseId = Meteor.call('courses.insert', _.extend({}, sampleCourse))
        const oldEnrollementCode = Courses.findOne({ _id: courseId }).enrollmentCode
        const course = Meteor.call('courses.regenerateCode', courseId)

        expect(course.enrollmentCode).to.not.equal(oldEnrollementCode)
      })

      it('can edit course (courses.edit)', () => {
        let courseId = Meteor.call('courses.insert', _.extend({}, sampleCourse))

        let editedCourse = Courses.findOne({ _id: courseId })
        editedCourse.name = 'edited name'
        editedCourse.deptCode = 'edited deptCode'
        editedCourse.courseNumber = 'edited courseNumber'
        editedCourse.section = 'edited section'
        editedCourse.semester = 'edited semester'

        let newOwnerId = Random.id()
        editedCourse.owner = newOwnerId

        Meteor.call('courses.edit', editedCourse)

        // verify edits
        let courseFromDb = Courses.findOne({ _id: courseId })
        expect(courseFromDb.owner).to.equal(editedCourse.owner)
        expect(courseFromDb.name).to.equal(editedCourse.name)
        expect(courseFromDb.deptCode).to.equal(editedCourse.deptCode)
        expect(courseFromDb.courseNumber).to.equal(editedCourse.courseNumber)
        expect(courseFromDb.section).to.equal(editedCourse.section)
        expect(courseFromDb.semester).to.equal(editedCourse.semester)
        // other method handles regenration of enrollment code
        expect(courseFromDb.enrollmentCode).to.equal(editedCourse.enrollmentCode)
      })
    }) // end describe('methods')
  }) // end describe('Courses')
} // end Meteor.isServer
