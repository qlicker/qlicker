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
      return Courses.find({ });
    //} else {
    //  this.ready();
    //}
  });
}


Meteor.methods({
  'courses.insert'(course) {
    check(course.name, NonEmptyString) //TODO change to check pattern
    check(course.deptCode, NonEmptyString)
    check(course.courseNumber, NonEmptyString)
    check(course.section, NonEmptyString)
    check(course.owner, NonEmptyString)

    if (!Meteor.isTest && !Meteor.userHasRole(Meteor.user(), 'professor')) {
      throw new Meteor.Error('not-authorized');
    }
 
    return Courses.insert(course);
  },
  'courses.delete'(courseId) {
    // TODO enforce permissions
    
    Courses.remove({ '_id': courseId })
  }
  /*
  'tasks.remove'(taskId) {
    check(taskId, String)
 
    Tasks.remove(taskId)
  },
  'tasks.setChecked'(taskId, setChecked) {
    check(taskId, String)
    check(setChecked, Boolean)
 
    Tasks.update(taskId, { $set: { checked: setChecked } })
  },*/
});
