/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// course.jsx: student page for course details

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import { CreateQuestionModal } from '../../modals/CreateQuestionModal'

import { Courses } from '../../../api/courses'
import { Sessions } from '../../../api/sessions'
import { SessionListItem } from '../../SessionListItem'

class _Course extends Component {

  constructor (props) {
    super(props)

    this.state = { submittingQuestion: false,
      expandedSessionlist: false }
    this.sessionClickHandler = this.sessionClickHandler.bind(this)
  }

  sessionClickHandler (session) {
    // Disabled the student.results route for now:
     if (session.status === 'done' && session.reviewable) {
       Router.go('session.results', { sessionId: session._id })
     } else {
       Router.go('session', { _id: session._id })
    }
  }

  renderSessionList () {
    // let sessions = this.props.course.sessions || []
    let sessions = this.props.sessions || []
    const statusSort = {hidden: 2, visible: 3, running: 1, done: 4}
    sessions = _(sessions).chain().sortBy(function (ses) {
      return ses.date
    }).reverse().sortBy(function (ses) {
      return statusSort[ses.status]
    }).value()

    const maxNum = 8
    const totalSessions = sessions.length
    if (!this.state.expandedSessionlist) sessions = sessions.slice(0, maxNum)
    const toggleExpandedSessionlist = () => { this.setState({ expandedSessionlist: !this.state.expandedSessionlist }) }
    const expandText = !this.state.expandedSessionlist ? 'Show all' : 'Show less'
    return (<div>
      {
        sessions.map((s) => (<SessionListItem
          key={s._id}
          session={s}
          click={() => this.sessionClickHandler(s)} />))
      }
      { totalSessions > maxNum
        ? <a href='#' className='show-more-item' onClick={toggleExpandedSessionlist}>
          <div className='ql-list-item'>{expandText}</div>
        </a> : '' }
    </div>)
  }

  render () {
    const toggleSubmittingQuestion = () => {
      this.setState({ submittingQuestion: !this.state.submittingQuestion })
    }
    return (
      <div className='container ql-manage-course'>
        <h2>{this.props.course.name} [<span className='uppercase'>{this.props.course.fullCourseCode()}</span>]</h2>
        {this.props.course.allowStudentQuestions
          ? <button className='submit-question-button btn btn-primary' onClick={toggleSubmittingQuestion}>Submit Question</button>
          : ''
        }

        { this.renderSessionList() }

        <br />

        { this.state.submittingQuestion
          ? <CreateQuestionModal courseId={this.props.course._id} semester={this.props.course.semester} done={toggleSubmittingQuestion} />
          : '' }

      </div>)
  }

}

export const Course = createContainer((props) => {
  const handle = Meteor.subscribe('courses.single', props.courseId)
    && Meteor.subscribe('userData')
    && Meteor.subscribe('sessions.forCourse',props.courseId)

  let student = Meteor.users.find({ _id: Meteor.userId() }).fetch()[0]
  let course = Courses.find({ _id: props.courseId }).fetch()[0]
  let sessions = Sessions.find({ courseId: props.courseId }).fetch()
  return {
    course: course,
    student: student,
    sessions: sessions,
    loading: !handle.ready()
  }
}, _Course)
