/* eslint-env mocha */
 
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { assert } from 'meteor/practicalmeteor:chai';
import { sinon } from 'meteor/practicalmeteor:sinon';

import { _ } from 'underscore'

import { Courses } from './courses.js'

 
if (Meteor.isServer) {

  //TODO Stub Meteor user

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
      }


      beforeEach(() => {
        Courses.remove({});
      })

      it('can insert new course', () => {
        let courseId = Meteor.call('courses.insert', _.extend({}, sampleCourse))

        assert.equal(Courses.find({ _id : courseId }).count(), 1);
      })


      it('can delete course', () => {
        let courseId = Meteor.call('courses.insert', _.extend({}, sampleCourse))

        Meteor.call('courses.delete', courseId)
        assert.equal(Courses.find({ _id : courseId }).count(), 0);        
      })

      it('can edit course', () => {
        let courseId = Meteor.call('courses.insert', _.extend({}, sampleCourse))

        let editedCourse =  _.extend({ _id: courseId }, sampleCourse)
        editedCourse.name = 'edited name'
        editedCourse.deptCode = 'edited deptCode'
        editedCourse.courseNumber = 'edited courseNumber'
        editedCourse.section = 'edited section'
        
        let newOwnerId = Random.id()
        editedCourse.owner = newOwnerId

        Meteor.call('courses.edit', editedCourse)

        let courseFromDb = Courses.findOne({ _id : courseId })
        assert.equal(courseFromDb.owner, editedCourse.owner);        
        assert.equal(courseFromDb.name, editedCourse.name);        
        assert.equal(courseFromDb.deptCode, editedCourse.deptCode);        
        assert.equal(courseFromDb.courseNumber, editedCourse.courseNumber);        
        assert.equal(courseFromDb.section, editedCourse.section);        
      })


    }) //end describe('methods')
  }) // end describe('Courses')


} // end Meteor.isServer
