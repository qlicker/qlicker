/* eslint-env mocha */

import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { expect } from 'meteor/practicalmeteor:chai'
import { sinon } from 'meteor/practicalmeteor:sinon'

import { _ } from 'underscore'

import { Courses } from './courses.js'

if (Meteor.isServer) {
  // TODO Stub Meteor user

  describe('Courses', () => {
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
    describe('methods', () => {
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
        expect(courseFromDb.deptCode).to.equal(editedCourse.deptCode.toLowerCase())
        expect(courseFromDb.courseNumber).to.equal(editedCourse.courseNumber.toLowerCase())
        expect(courseFromDb.section).to.equal(editedCourse.section)
        expect(courseFromDb.semester).to.equal(editedCourse.semester.toLowerCase())
        // other method handles regenration of enrollment code
        expect(courseFromDb.enrollmentCode).to.equal(editedCourse.enrollmentCode)
      })
    })// end describe('methods')
    describe('course<=>user methods', () => {
      beforeEach(() => {
        Courses.remove({})
        Meteor.users.remove({})
      })

      const prepWork = (assertions) => {
        const studentUserId = Accounts.createUser({
          email: 'email@email.com',
          password: 'test value',
          profile: {
            firstname: 'test value',
            lastname: 'test value',
            roles: ['student']
          }
        })
        let courseId = Meteor.call('courses.insert', _.extend({}, sampleCourse))

        assertions(courseId, studentUserId)
      }

      it('can add student (courses.addStudent)', () => {
        prepWork((courseId, studentUserId) => {
          Meteor.call('courses.addStudent', courseId, studentUserId)
          
          const course = Courses.findOne({ _id: courseId })
          const student = Meteor.users.findOne({ _id: studentUserId })

          expect(course.students.length).to.equal(1)
          expect(student.profile.courses.length).to.equal(1)
        })
      })

      it('can remove student (courses.removeStudent)', () => {
        prepWork((courseId, studentUserId) => {
          Meteor.call('courses.addStudent', courseId, studentUserId)
          Meteor.call('courses.removeStudent', courseId, studentUserId)

          expect(Meteor.users.findOne({ _id: studentUserId }).profile.courses.length).to.equal(0)
          expect(Courses.findOne({ _id: courseId }).students.length).to.equal(0)
        })
      })

      // it('can enroll using code (courses.checkAndEnroll)', () => {
        // prepWork((course, student) => { // TODO
          // if (!Meteor.userId()) {
          //   sinon.stub(Meteor, 'userId', () => student._id)
          //   sinon.stub(Meteor, 'user', () => { return student })
          // }
          // Meteor.call('courses.checkAndEnroll', course.deptCode, course.courseNumber, course.enrollmentCode)

          // expect(course.students.length).to.equal(1)
          // expect(student.profile.courses.length).to.equal(1)
        // })
      // })
    }) // end describe('course<=>user methods')
    /*
    describe('course<=>session methods', () => {
      it('can create session (courses.createSession)*', () => {

      })

      it('can delete session (courses.deleteSession)*', () => {

      })
    }) // end describe('course<=>session methods')
    */
  }) // end describe('Courses')
} // end Meteor.isServer
