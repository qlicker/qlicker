// QLICKER
// Author: Enoch T <me@enocht.am>
//
// StudentCourseComponent.jsx: expanding UI component for student dashboard

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Sessions } from '../api/sessions'

import { CourseListItem } from './CourseListItem'
import { SessionListItem } from './SessionListItem'

/**
 * React component (meteor reactive) that combines a CourseListItem and SessionListItem for active sessions.
 * @prop {Course} course - course object
 * @prop {String} sessionRoute - route to navigate to for each session
 */
export class _StudentCourseComponent extends Component {

  constructor (p) {
    super(p)
    this.state = { }
    this.unEnroll = this.unEnroll.bind(this)
    this.addSubmittedQuiz = this.addSubmittedQuiz.bind(this)  
  }

  addSubmittedQuiz (id) {
    let submitted = this.state.submitted ? this.state.submitted : []
    if (!_(submitted).contains(id) )submitted.push(id)
    this.setState({submitted:submitted})
  }

  componentDidMount () {
    if (this.props.sessions){
      this.props.sessions.forEach(s => {
        if (s.quiz){
          Meteor.call('sessions.quizSubmitted', s._id, (err, submitted) =>{
            if(err) alertify.error(err.error)
            if(!err && submitted) {
              this.addSubmittedQuiz(s._id)
            }
          })
        }
      })
    }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.sessions){
      nextProps.sessions.forEach(s => {
        if(s.quiz){
          Meteor.call('sessions.quizSubmitted', s._id, (err, submitted) =>{
            if(err) alertify.error(err.error)
            if(!err && submitted) {
              this.addSubmittedQuiz(s._id)
            }
          })
        }
      })
    }
  }

  unEnroll (courseId, userId) {
    if (confirm('Are you sure you want to un-enroll from the course?')){
      Meteor.call('courses.removeStudent', courseId, userId, (error) => {
        if (error) return alertify.error(error.message)
        else return alertify.success('Un-enrolled from course')
      })
    }
  }

  render () {
    const course = this.props.course
    const user = Meteor.user()
    const isStudent = user.isStudent(course._id)
    const controls = isStudent ? [{ label: 'Un-enroll', click: () => this.unEnroll(course._id, user._id) }] : null

    return (<div className='ql-student-course-component'>
      { this.props.inactive ?
          <CourseListItem isTA={this.props.isTA} course={course} inactive />
        : <div>
          <CourseListItem isTA={this.props.isTA} course={course} controls={controls} click={() => Router.go('course', { courseId: course._id })} />
            {
              this.props.sessions.map((s) => {
                if (!s || s.quizIsClosed() || (this.state.submitted && _(this.state.submitted).contains(session._id))) return
                const sId = s._id
                const nav = () => {
                  if (!Meteor.user().isInstructor(this.props.course._id)){
                    Router.go(this.props.sessionRoute, { _id: s._id, courseId: course._id })
                  }
                  else if (s.status === 'running') Router.go('session.run', { sessionId: sId, courseId: course._id })
                  else Router.go('session.edit', { sessionId: sId, courseId: course._id })
                }
                return <SessionListItem key={s._id} session={s} click={nav} />
            })
          }
        </div>
       }
      </div>)
  } //  end render
}

export const StudentCourseComponent = createContainer((props) => {
  const handle = Meteor.subscribe('sessions.forCourse', props.course._id)
  const sessions = Sessions.find({ courseId: props.course._id, $or: [{ status: 'visible' }, { status: 'running' }] }).fetch()
  const user = Meteor.user()
  const isTA = user.isInstructor(props.course._id) && !user.hasGreaterRole('professor')

  return {
    sessions: sessions,
    loading: !handle.ready(),
    isTA: isTA,
  }
}, _StudentCourseComponent)

StudentCourseComponent.propTypes = {
  course: PropTypes.object.isRequired,
  sessionRoute: PropTypes.string,
  controls:  PropTypes.array
}
