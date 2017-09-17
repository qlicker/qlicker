/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionListItem.jsx: React component list item for each course
// typically used on student and professor overview page

import React from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { QuestionListItem } from './QuestionListItem'

/**
 * List item wrapper for QuestionListItem.
 * Used to fetch reactive data for student's name
 * @augments ListItem
 * @prop {Question} question - question object
 */
export class _StudentQuestionListItem extends QuestionListItem {
  // render in super class
}

export const StudentQuestionListItem = createContainer((props) => {
  const handle = Meteor.subscribe('users.myStudents', {cId: props.question.courseId}) &&
    Meteor.subscribe('users.myTAs', {cId: props.question.courseId})
  const user = Meteor.users.findOne(props.question.creator)
  const name = user ? user.getName() : 'Unknown'
  const owner = Meteor.users.findOne(props.question.owner)
  const nameOwner = owner ? owner.getName(): 'Unknown'
  return {
    student: user,
    details: 'Submitted by: ' + name +', owned by: '+nameOwner,
    loading: !handle.ready()
  }
}, _StudentQuestionListItem)
