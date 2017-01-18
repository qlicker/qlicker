// QLICKER
// Author: Enoch T <me@enocht.am>
// 
// course.js: JS related to course collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

// import { NonEmptyString } from '../../server/helpers.js'

NonEmptyString = Match.Where(function (x) { //TODO why doesn't import work in test env?
  check(x, String)
  return x.length > 0
});


const coursePattern = {
  name: NonEmptyString,
  deptCode: NonEmptyString,
  courseNumber: NonEmptyString,
  section: NonEmptyString,
  owner: NonEmptyString,
  createdAt: Date,
  _id: Match.Maybe(NonEmptyString)
}


/* Ex. CISC498-001
 *
 * course: {
 *  name: 'Information Technology Project (2016-17)',
 *  deptCode: 'CISC',
 *  courseNumber: '498',
 *  section: '001'
 * } 
 */


export const Courses = new Mongo.Collection('courses');

if (Meteor.isServer) {
  Meteor.publish("courses", function () {
    //if (this.userId) {
      return Courses.find({ owner: this.userId });
    //} else {
      this.ready();
    //}
  });
}


Meteor.methods({
  'courses.insert'(course) {
    check(course, coursePattern) //TODO change to check pattern

    if (!Meteor.isTest && !Meteor.userHasRole(Meteor.user(), 'professor')) {
      throw new Meteor.Error('not-authorized');
    }
 
    return Courses.insert(course);
  },
  'courses.delete'(courseId) {
    // TODO enforce permissions
    
    Courses.remove({ _id: courseId })
  },
  'courses.edit'(course) {
    check(course._id, NonEmptyString)
    check(course, coursePattern)
    let courseId = course._id

    // TODO enforce permissions
    
    Courses.update({ _id: courseId }, { 
      $set: { 
        name: course.name,
        deptCode: course.deptCode,
        courseNumber: course.courseNumber,
        section: course.section,
        owner: course.owner
      } 
    })
  }
});
