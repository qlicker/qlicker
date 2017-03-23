// QLICKER
// Author: Enoch T <me@enocht.am>
//
// PickCourseModal.jsx: modal with list of your courses

import React, { Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../api/courses'

import { CourseListItem } from '../CourseListItem'

export class _PickCourseModal extends Component {

  // constructor (p) {
  //   super(p)
  // }

  done (e) {
    this.props.done()
  }

  render () {
    return (<div className='ql-modal-container' onClick={this.done}>
      <div className='ql-modal ql-modal-selectcourse container' onClick={this.preventPropagation}>
        <div className='ql-modal-header'><h2>Select a Course</h2></div>
        {
          this.props.courses.map((c) => {
            return <CourseListItem course={c} click={() => this.props.selected(c._id)} />
          })
        }
      </div>
    </div>)
  } //  end render

} // end PickCourseModal



export const PickCourseModal = createContainer((props) => {
  const handle = Meteor.subscribe('courses')

  const courses = Courses.find({ owner: Meteor.userId(), inactive: { $in: [null, false] } }).fetch()

  return {
    courses: courses,
    loading: !handle.ready()
  }
}, _PickCourseModal)


