// QLICKER
// Author: Enoch T <me@enocht.am>
// 
// CreateCourseModal.jsx: popup dialog to prompt for course details
 
import React, { Component } from 'react'
import _ from 'underscore'

import { Courses } from '../../api/courses.js'

export default class CreateCourseModal extends Component {

  constructor(props) {
    super(props)

    this.state = {
      name: '',
      deptCode: '',
      courseNumber: '',
      section: ''
    }
  }

  setValue(e) {
    let stateEdits = {}
    stateEdits[e.target.dataset.name] = e.target.value
    this.setState(stateEdits)
  }

  handleSubmit(e) {
    e.preventDefault()
    
    let course = _.extend({
      createdAt: new Date(),
      owner: Meteor.userId()      
    }, this.state)

    // TODO validate data
    Meteor.call('courses.insert', course)


    // TODO createCourse, clear fields
  }

  render() {
    return (
      <div className='ui-modal ui-modal-createcourse'>
        <form className='ui-form-createcourse' onSubmit={this.handleSubmit.bind(this)}>
          Name: <input type='text' data-name='name' onChange={this.setValue.bind(this)} placeholder='Information Technology Project (2016-17)' /><br/>
          Department Code: <input type='text' data-name='deptCode' onChange={this.setValue.bind(this)} placeholder='CISC' /><br/> 
          Course Number: <input type='text' data-name='courseNumber' onChange={this.setValue.bind(this)} placeholder='498' /><br/>
          Section: <input type='text' data-name='section' onChange={this.setValue.bind(this)} placeholder='001' /><br/>
          <input type='submit' />
        </form>
      </div>)
  } //  end render

} // end CreateCourseModal
