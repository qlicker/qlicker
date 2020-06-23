/* eslint-env mocha */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// Unit tests for course data maniupulation methods

import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { expect } from 'meteor/practicalmeteor:chai'

import _ from 'underscore'

import { createStubs, restoreStubs } from '../../stubs.tests.js'

import { Courses } from './courses.js'
import './users.js'

const userId = Random.id()
export const sampleCourse = {
  createdAt: new Date(),
  owner: userId,
  name: 'Intro to Computer Science',
  deptCode: 'CISC',
  courseNumber: '101',
  section: '001',
  semester: 'F17'
}

export const createAndStubProfessor = () => {
  const profUserId = Accounts.createUser({
    email: 'email@email.com',
    password: 'test value',
    profile: {
      firstname: 'test value',
      lastname: 'test value',
      roles: ['professor']
    }
  })
  createStubs(profUserId)
  return profUserId
}

export const prepStudentCourse = (assertions) => {
  const studentUserId = Accounts.createUser({
    email: 'lol@email.com',
    password: 'test value',
    profile: {
      firstname: 'test value',
      lastname: 'test value',
      roles: ['student']
    }
  })
  const profUserId = createAndStubProfessor()
  let courseId = Meteor.call('courses.insert', _.extend({ owner: profUserId }, _.omit(sampleCourse, 'owner')))

  assertions(courseId, studentUserId)
}

if (Meteor.isServer) {
  describe('Courses', () => {
    describe('methods', () => {
      beforeEach(() => {
        Courses.remove({})
        Meteor.users.remove({})
        restoreStubs()
      })

      it('can insert new course (courses.insert)', () => {
        createAndStubProfessor()
        let courseId = Meteor.call('courses.insert', sampleCourse)

        let cs = Courses.find({ _id: courseId })
        expect(cs.count()).to.equal(1)
      })

      it('can return full course code (.fullCourseCode)', () => {
        createAndStubProfessor()
        const courseId = Meteor.call('courses.insert', sampleCourse)

        const course = Courses.findOne({ _id: courseId })
        const strCourse = sampleCourse.deptCode + ' ' + sampleCourse.courseNumber + ' - ' + sampleCourse.section
        expect(course.fullCourseCode().toLowerCase()).to.equal(strCourse.toLowerCase())
      })

      it('can return short course code (.courseCode)', () => {
        createAndStubProfessor()
        const courseId = Meteor.call('courses.insert', sampleCourse)

        const course = Courses.findOne({ _id: courseId })
        const strCourse = sampleCourse.deptCode + sampleCourse.courseNumber
        expect(course.courseCode()).to.equal(strCourse.toLowerCase())
      })

      it('can delete course (courses.delete)', () => {
        prepStudentCourse((courseId, studentUserId) => {
          Meteor.call('courses.addStudent', courseId, studentUserId)
          Meteor.call('courses.delete', courseId)
          expect(Courses.find({ _id: courseId }).count()).to.equal(0)
          expect(Meteor.users.find({ _id: studentUserId }).fetch()[0].profile.courses.length).to.equal(0)
        })
      })

      it('can regenerate code (courses.regenerateCode)', () => {
        const profUserId = createAndStubProfessor()
        const courseId = Meteor.call('courses.insert', _.extend({ owner: profUserId }, _.omit(sampleCourse, 'owner')))
        const oldEnrollementCode = Courses.findOne({ _id: courseId }).enrollmentCode
        const course = Meteor.call('courses.regenerateCode', courseId)

        expect(course.enrollmentCode).to.not.equal(oldEnrollementCode)
      })

      it('can edit course (courses.edit)', () => {
        const profUserId = createAndStubProfessor()
        let courseId = Meteor.call('courses.insert', _.extend({ owner: profUserId }, _.omit(sampleCourse, 'owner')))

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

      it('can get course code from courseId (courses.getCourseCodeTag)', () => {
        const profUserId = createAndStubProfessor()
        let courseId = Meteor.call('courses.insert', _.extend({ owner: profUserId }, _.omit(sampleCourse, 'owner')))
        const codeToTest = Meteor.call('courses.getCourseCodeTag', courseId)
        const course = Courses.findOne(courseId)
        expect(codeToTest.value).to.equal(course.courseCode().toUpperCase())
      })
    })// end describe('methods')

    describe('course<=>user methods', () => {
      beforeEach(() => {
        restoreStubs()
        Courses.remove({})
        Meteor.users.remove({})
      })

      it('can add student (courses.addStudent)', () => {
        prepStudentCourse((courseId, studentUserId) => {
          Meteor.call('courses.addStudent', courseId, studentUserId)

          const course = Courses.findOne({ _id: courseId })
          const student = Meteor.users.findOne({ _id: studentUserId })

          expect(course.students.length).to.equal(1)
          expect(student.profile.courses.length).to.equal(1)
        })
      })

      it('can remove student (courses.removeStudent)', () => {
        prepStudentCourse((courseId, studentUserId) => {
          Meteor.call('courses.addStudent', courseId, studentUserId)
          Meteor.call('courses.removeStudent', courseId, studentUserId)

          expect(Meteor.users.findOne({ _id: studentUserId }).profile.courses.length).to.equal(0)
          expect(Courses.findOne({ _id: courseId }).students.length).to.equal(0)
        })
      })

      it('can enroll using code (courses.checkAndEnroll)', () => {
        prepStudentCourse((courseId, studentUserId) => {
          restoreStubs()
          createStubs(studentUserId)
          const course = Courses.findOne({ _id: courseId })

          Meteor.call('courses.checkAndEnroll', course.enrollmentCode)

          expect(Courses.findOne({ _id: courseId }).students.length).to.equal(1)
          expect(Meteor.users.findOne({ _id: studentUserId }).profile.courses.length).to.equal(1)
        })
      })

      it('can toggle course inactive attribute')
    }) // end describe('course<=>user methods')
  }) // end describe('Courses')
} // end Meteor.isServer
