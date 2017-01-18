// QLICKER
// Author: Enoch T <me@enocht.am>
// 
// professor_dashboard.jsx: professor overview page

import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'

import { LogoutButton } from '../Buttons'
import ProfileCard from '../ProfileCard'
import CourseListItem from '../CourseListItem'
import CreateCourseModal from '../modals/CreateCourseModal'

import { Courses } from '../../api/courses.js'


class ProfessorDashboard extends Component {

  constructor(props) {
    super(props)

    this.state = { creatingCourse: false }
  }


  promptCreateCourse(e) {
    this.setState({ creatingCourse: true })
  
  } 

  handleCreateCourse(e) {
    this.setState({ creatingCourse: false })
  }

  renderCourseList() {
    //console.log('this.courses',this.props.courses)
    return this.props.courses.map((course) => (
      <CourseListItem key={course._id} course={course} />
    ));
  } 

  render() {
    let courseList = <div>Hello</div> 
    //if (this.props.loading) courseList = <div>loading</div>
    courseList = <ul className='ui-courselist'>{this.renderCourseList()}</ul>
 
    return (
      <div className='ui-page-container'>
      
        <div className='ui-top-bar'>
          <a href={Router.routes['professor'].path()} className='ui-wordmark'><h1>Qlicker</h1></a>
      
          <div className='ui-button-bar'>
            <ProfileCard />
            <LogoutButton redirect='login'/>
          </div>
        </div>
      
        <div className='container ui-professor-page'>

          <h2>My Classes</h2>
          <button onClick={this.promptCreateCourse.bind(this)}>Create Course</button>

          <hr/>
          
          { courseList }  

        </div>

        <div className='ui-modal-container' ref='modals'>
          { this.state.creatingCourse ? <CreateCourseModal done={this.handleCreateCourse.bind(this)} /> : '' }
        </div>
      </div>)
  
  }

}
  

export default createContainer(() => {
  const handle = Meteor.subscribe('courses')
  
  return {
    courses: Courses.find({ owner: Meteor.userId() }).fetch(),
    loading: !handle.ready()
  }
}, ProfessorDashboard);
  



