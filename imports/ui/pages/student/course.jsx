/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// course.jsx: student page for course details

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'

import { CreateQuestionModal } from '../../modals/CreateQuestionModal'

import { Courses } from '../../../api/courses'
import { Sessions } from '../../../api/sessions'
import { SessionListItem } from '../../SessionListItem'

class _Course extends Component {

  constructor (props) {
    super(props)

    this.state = { submittingQuestion: false }
  }

  renderSessionList () {
    // let sessions = this.props.course.sessions || []
    let sessions = this.props.sessions || []
    return (<div>
      { sessions.map((s) => {
        return (<SessionListItem key={s.sessionId} session={s} />)
      }) }
    </div>)
  }

  render () {
    const toggleSubmittingQuestion = () => {
      this.setState({ submittingQuestion: !this.state.submittingQuestion })
    }

    return (
      <div className='container ql-manage-course'>
        <h2>Course: {this.props.course.name} </h2>

        <button className='btn btn-default' onClick={toggleSubmittingQuestion}>Submit Question</button>
        <br />
        { this.renderSessionList() }

        <br />

        { this.state.submittingQuestion
          ? <CreateQuestionModal courseId={this.props.course._id} done={toggleSubmittingQuestion} />
          : '' }

      </div>)
  }

}

export const Course = createContainer((props) => {
  const handle = Meteor.subscribe('courses') && Meteor.subscribe('sessions')

  let student = Meteor.users.find({ _id: Meteor.userId() }).fetch()[0]
  return {
    course: Courses.find({ _id: props.courseId }).fetch()[0],
    student: student,
    sessions: Sessions.find({ courseId: { $in: student.profile.courses || [] } }).fetch(),
    loading: !handle.ready()
  }
}, _Course)

