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
    this.sessionClickHandler = this.sessionClickHandler.bind(this)
  }

  sessionClickHandler (session) {
    //Disabled the student.results route for now:
    //if (session.status === 'done') {
    //  Router.go('student.results', { studentId: Meteor.userId(), courseId: this.props.course._id })
    //} else {
      Router.go('session', { _id: session._id })
    //}
  }

  renderSessionList () {
    // let sessions = this.props.course.sessions || []
    let sessions = this.props.sessions || []
    const statusSort = {hidden:2, visible:3, running:1, done:4}
    sessions = _(sessions).chain().sortBy( function(ses){
                   return ses.date
                 }).reverse().sortBy( function(ses){
                   return statusSort[ses.status]
                 }).value()

    return (<div>
      {
        sessions.map((s) => (<SessionListItem
          key={s._id}
          session={s}
          click={() => this.sessionClickHandler(s)} />))
      }
    </div>)
  }

  render () {
    const toggleSubmittingQuestion = () => {
      this.setState({ submittingQuestion: !this.state.submittingQuestion })
    }

    return (
      <div className='container ql-manage-course'>
        <h2>{this.props.course.name} [<span className='uppercase'>{this.props.course.fullCourseCode()}</span>]</h2>
        {this.props.course.allowStudentQuestions ?
          <button className='submit-question-button btn btn-primary' onClick={toggleSubmittingQuestion}>Submit Question</button>
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
  const handle = Meteor.subscribe('courses') && Meteor.subscribe('sessions')

  let student = Meteor.users.find({ _id: Meteor.userId() }).fetch()[0]
  return {
    course: Courses.find({ _id: props.courseId }).fetch()[0],
    student: student,
    sessions: Sessions.find({ courseId: props.courseId }).fetch(),
    loading: !handle.ready()
  }
}, _Course)
