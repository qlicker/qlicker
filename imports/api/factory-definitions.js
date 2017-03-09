// QLICKER
// Author: Enoch T <me@enocht.am>
//
// factory-definitions.js: definitions for fake data creation

import { Factory } from 'meteor/dburles:factory'
import { Random } from 'meteor/random'

import { Courses } from './courses'
import { Questions } from './questions'
import { Sessions } from './sessions'
import Helpers from './helpers'



Factory.define('course', Courses, {
  name: 'Information Technology Project (2016-17)',
  deptCode: 'CISC',
  courseNumber: '498',
  section: '001',
  owner: Random.id(),
  enrollmentCode: Helpers.RandomEnrollmentCode(),
  semester: 'F17',
  inactive: false,
  students: [ Random.id() ],
  createdAt: new Date()
})

Factory.define('session', Sessions, {
  name: 'Week 3 Lecture 1',
  description: 'Quiz about stuff',
  courseId: Factory.get('course'),
  status: 'visible',
  quiz: false,
  dueDate: null,
  questions: [ Factory.get('question') ],
  createdAt: new Date()
})
