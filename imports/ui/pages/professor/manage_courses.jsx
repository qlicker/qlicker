// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_courses.jsx: all courses (active & inactive) page

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { withTracker }  from 'meteor/react-meteor-data'

import { CourseListItem } from '../../CourseListItem'
import { CreateCourseModal } from '../../modals/CreateCourseModal'

import { Courses } from '../../../api/courses.js'

class _ManageCourses extends Component {

  constructor (props) {
    super(props)

    this.state = { creatingCourse: false }

    this.doneCreatingCourse = this.doneCreatingCourse.bind(this)
    this.promptCreateCourse = this.promptCreateCourse.bind(this)
    this.deleteCourse = this.deleteCourse.bind(this)
    this.setCourseActive = this.setCourseActive.bind(this)
  }

  deleteCourse (courseId) {
    if (confirm('Are you sure?')) {
      Meteor.call('courses.delete', courseId, (error) => {
        if (error) return alertify.error('Error deleting course')
      })
    }
  }

  setCourseActive (courseId, active) {
    if (confirm('Are you sure?')) {
      Meteor.call('courses.setActive', courseId, active, (error) => {
        if (error) return alertify.error('Error archiving course')
      })
    }
  }


  promptCreateCourse (e) {
    this.setState({ creatingCourse: true })
  }

  doneCreatingCourse (e) {
    this.setState({ creatingCourse: false })
    Meteor.setTimeout(this.forceUpdate, 500)
  }

  renderCourseList (cList) {
    return cList.map( (course) => {
      let controls = []
      if (course.inactive) {
        controls.push( { label: 'Make active', click: () => this.setCourseActive(course._id, true) } )
        controls.push( { label: 'Delete', click: () => this.deleteCourse(course._id) } )
      } else {
        controls.push( { label: 'Make inactive', click: () => this.setCourseActive(course._id, false) } )
      }
      return(
        <CourseListItem
          key={course._id}
          course={course}
          click={() => { Router.go('course', { courseId: course._id }) }}
          controls={controls} />
      )
    })
  }

  render () {
    if (this.props.loading || !this.props.courses) return <div className='ql-subs-loading'>Loading</div>
    let active = this.props.courses.filter((c) => !c.inactive)
    let inactive = this.props.courses.filter((c) => c.inactive)

    return (
      <div className='container ql-professor-page'>
        <h1>Courses</h1>
        <button className='btn' onClick={this.promptCreateCourse}>Create new course</button>
        <div className='ql-courselist'>
          { this.renderCourseList(active) }
        </div>
        <br /><br />
        { inactive && inactive.length > 0
          ? <div>
              <h2>Inactive Courses</h2>
              <div className='ql-courselist'>
                { this.renderCourseList(inactive) }
              </div>
            </div>
          : ''
        }
        { this.state.creatingCourse ? <CreateCourseModal done={this.doneCreatingCourse} /> : '' }
      </div>)
  }
}

export const ManageCourses = withTracker(() => {
  const handle = Meteor.subscribe('courses')

  return {
    courses: Courses.find({ instructors: Meteor.userId() }).fetch(),
    loading: !handle.ready()
  }
})(_ManageCourses)
