// QLICKER
// Author: Enoch T <me@enocht.am>
//
// PickCourseModal.jsx

import React from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../api/courses'

import { CourseListItem } from '../CourseListItem'
import { ControlledForm } from '../ControlledForm'

/**
 * modal to pick a course from a list of your own courses
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
export class _PickCourseModal extends ControlledForm {

  // constructor (p) {
  //   super(p)
  // }

  done (e) {
    this.props.done()
  }

  render () {
    return (<div className='ql-modal-container' onClick={this.done}>
      <div className='ql-modal ql-modal-selectcourse ql-card' onClick={this.preventPropagation}>
        <div className='ql-modal-header ql-header-bar'><h3>Select a Course</h3></div>
        <div className='ql-card-content'>
          {
            this.props.courses.map((c) => {
              return <CourseListItem course={c} click={() => this.props.selected(c._id)} />
            })
          }
        </div>
      </div>
    </div>)
  } //  end render

} // end PickCourseModal

export const PickCourseModal = createContainer((props) => {
  const handle = Meteor.subscribe('courses')

  const courses = Courses.find({ instructors: Meteor.userId(), inactive: { $in: [null, false] } }).fetch()

  return {
    courses: courses,
    loading: !handle.ready()
  }
}, _PickCourseModal)

