/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_course.jsx: page for managing a specific course

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import _ from 'underscore'
import { createContainer } from 'meteor/react-meteor-data'

import { Courses } from '../../../api/courses'

import Select from 'react-select'

import { ROLES } from '../../../configs'


class _ManageCourseGroups extends Component {

  constructor (props) {
    super(props)

    this.state = {
    }

    this.setCategory = this.setCategory.bind(this)
  }

  setCategory (categoryNumber) {
    const category = _(course.groupCategories).findWhere({ categoryNumber:categoryNumber })
    this.setState({ category:category })
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    let categoryOptions = []
    const groupCategories = this.props.course.groupCategories ? this.props.course.groupCategories : []

    groupCategories.forEach( (category) => {
      categoryOptions.push({ value:category.categoryNumber,
                             label:category.categoryName })
    })

    const doNothing = () => {}
    return(
      <div className='container ql-manage-course-groups'>
        <div className='row'>
          <div className='col-md-4'>
            <div className='ql-card'>
              <div className='ql-header-bar'>
                <h4>Categories</h4>
              </div>
              <div className='ql-card-content'>
                <div className='btn-group btn-group-justified'>
                  <div className='btn btn-default' onClick={doNothing}> Create a new Category </div>
                </div>
                <Select
                  name='tag-input'
                  placeholder='Type to search for a category'
                  value={this.state.category ? this.state.category.categoryNumber : null}
                  options={this.categoryOptions}
                  onChange={this.setCategory}
                  />
              </div>
            </div>
          </div>

          <div className='col-md-4'>
            <div className='ql-card'>
              <div className='ql-header-bar'>
                <h4>Group</h4>
              </div>
              <div className='ql-card-content'>
              </div>
            </div>
          </div>

          <div className='col-md-4'>
            <div className='ql-card'>
              <div className='ql-header-bar'>
                <h4>Students not in a group</h4>
              </div>
              <div className='ql-card-content'>
              </div>
            </div>
          </div>


        </div>
      </div>
    )

  }

}

export const ManageCourseGroups = createContainer((props) => {
  const handle = Meteor.subscribe('courses.single', props.courseId) &&
    Meteor.subscribe('users.studentsInCourse', props.courseId)

  const course = Courses.find({ _id: props.courseId }).fetch()[0]

  const studentIds = course.students || []
  const students = Meteor.users.find({ _id: { $in: studentIds } }).fetch()

  return {
    course: course,
    students: _(students).indexBy('_id'),
    loading: !handle.ready()
  }
}, _ManageCourseGroups)
