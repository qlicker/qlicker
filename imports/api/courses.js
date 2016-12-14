// QLICKER
// Author: Enoch T <me@enocht.am>
// 
// course.js: JS related to course collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'

/* Ex. CISC498-001
 *
 * course: {
 *  name: 'Information Technology Project (2016-17)',
 *  departmentCode: 'CISC',
 *  courseNumber: '498',
 *  section: '001'
 * } 
 */


export const Courses = new Mongo.Collection('courses');

if (Meteor.isServer) {
  Meteor.publish("courses", function coursesPublication() {
    //if (this.userId) {
      return Courses.find({ });
    //} else {
    //  this.ready();
    //}
  });
}

