// QLICKER
// Author: Enoch T <me@enocht.am>
// 
// course.js: JS related to course collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check } from 'meteor/check'

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
    //check(course.name, String)
 
    // Make sure the user is logged in before inserting a task
    //if (! this.userId) {
    //  throw new Meteor.Error('not-authorized');
    //}
 
    Courses.insert(course);
  },
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
