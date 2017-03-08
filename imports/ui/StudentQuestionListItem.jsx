/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionListItem.jsx: React component list item for each course
// typically used on student and professor overview page

import React from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { QuestionListItem } from './QuestionListItem'

export class _StudentQuestionListItem extends QuestionListItem {
  // render in super class
}

export const StudentQuestionListItem = createContainer((props) => {
  const handle = Meteor.subscribe('userData')
  const user = Meteor.users.findOne(props.question.submittedBy)

  return {
    student: user,
    details: 'Submitted By: ' + user.getName(),
    loading: !handle.ready()
  }
}, _StudentQuestionListItem)


