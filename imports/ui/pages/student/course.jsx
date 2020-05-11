/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// course.jsx: student page for course details

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
//import { _ } from 'underscore'

import { Courses } from '../../../api/courses'
import { Sessions } from '../../../api/sessions'
import { SessionListItem } from '../../SessionListItem'

class _Course extends Component {

  constructor (props) {
    super(props)

    this.state = {
      expandedInteractiveSessionlist: false,
      expandedQuizlist: false
    }
    this.sessionClickHandler = this.sessionClickHandler.bind(this)

  }

  sessionClickHandler (session) {
    const user = Meteor.user()
    // Disabled the student.results route for now:
    if (session.status === 'done' && session.reviewable  ) {
      Router.go('session.results', { sessionId: session._id, courseId: this.props.course._id })
    }
    else if (session.status === 'done') {
      if (session.quiz) alertify.error('Quiz not reviewable')
      else alertify.error('Session not reviewable')
    }
    else if (session.quizWasSubmittedByUser(Meteor.userId())){
      alertify.error('Quiz already submitted')
    }
    else if (session.quiz && !session.quizIsActive(user) ){
      alertify.error('Quiz not open')
    }
    else {
      Router.go('session', { _id: session._id, courseId: this.props.course._id })
    }
  }

  renderInteractiveSessionList () {
    // let sessions = this.props.course.sessions || []
    let sessions = _(this.props.sessions).where({quiz:false}) || []
    const statusSort = {hidden: 2, visible: 3, running: 1, done: 4}
    sessions = _(sessions).chain().sortBy(function (ses) {
      return ses.date
    }).reverse().value()

    const maxNum = 6
    const totalSessions = sessions.length
    if (!this.state.expandedInteractiveSessionlist) sessions = sessions.slice(0, maxNum)
    const toggleExpandedSessionlist = () => { this.setState({ expandedInteractiveSessionlist: !this.state.expandedInteractiveSessionlist }) }
    const expandText = !this.state.expandedInteractiveSessionlist ? 'Show all' : 'Show less'
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
  renderQuizList () {
    // let sessions = this.props.course.sessions || []
    let sessions =  _(this.props.sessions).where({quiz:true}) || []
    const statusSort = {hidden: 2, visible: 3, running: 1, done: 4}
    const user = Meteor.user()
    sessions = _(sessions).chain().sortBy(function (ses) {
      if (ses.quizEnd){
        if (ses.quizIsUpcoming(user) ) return -ses.quizStart
        if (ses.quizIsActive(user) ) return -ses.quizEnd
        return ses.quizEnd
      } else return ses.date
      //return ses.quizEnd ? (ses.quizIsActive(Meteor.user()) ? -ses.quizEnd:-ses.quizEnd) : ses.date
    }).reverse().sortBy(function (ses) {
      return ses.quizIsActive(user) ? 1 : statusSort[ses.status]
    }).value()

    const maxNum = 6
    const totalSessions = sessions.length
    if (!this.state.expandedQuizlist) sessions = sessions.slice(0, maxNum)
    const toggleExpandedSessionlist = () => { this.setState({ expandedQuizlist: !this.state.expandedQuizlist }) }
    const expandText = !this.state.expandedQuizlist ? 'Show all' : 'Show less'
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
    //console.log(this.state)

    return (
      <div className='container ql-manage-course'>
        <h2>{this.props.course.name} [<span className='uppercase'>{this.props.course.fullCourseCode()}</span>]</h2>
        <h3> Interactive sessions </h3>
        { this.renderInteractiveSessionList() }
        <h3> Quizzes </h3>
        { this.renderQuizList() }
        <br />

      </div>)
  }

}

export const Course = createContainer((props) => {
  //console.log("subscribing")
  const handle = Meteor.subscribe('courses.single', props.courseId) &&
    Meteor.subscribe('userData') &&
    Meteor.subscribe('sessions.forCourse', props.courseId)

  let student = Meteor.users.findOne({ _id: Meteor.userId() })
  let course = Courses.findOne({ _id: props.courseId })
  let sessions = Sessions.find({ courseId: props.courseId }).fetch()
  //console.log(sessions)

  return {
    course: course,
    student: student,
    sessions: sessions,
    loading: !handle.ready()
  }
}, _Course)
