/* eslint-env mocha */
 
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { assert } from 'meteor/practicalmeteor:chai';

import { Courses } from './courses.js'
 
if (Meteor.isServer) {


  describe('Courses', () => {
    describe('methods', () => {
      const userId = Random.id();

      beforeEach(() => {
        Courses.remove({});
      })

      it('can insert new course', () => {
        let courseId = Meteor.call('courses.insert', {
          createdAt: new Date(),
          owner: userId,
          name: 'Intro to Computer Science',
          deptCode: 'CISC',
          courseNumber: '101',
          section: '001',
        })

        assert.equal(Courses.find().count(), 1);
      })
    })
  })





}
