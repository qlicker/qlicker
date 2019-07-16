// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CreateCourseModal.jsx

import React, { PropTypes, Component } from 'react'
import _ from 'underscore'
import Select from 'react-select'
import 'react-select/dist/react-select.css'
import { Courses } from '../../api/courses'
import { createContainer } from 'meteor/react-meteor-data'

/**
 * modal dialog to prompt for course details
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
class _QuizExtensionsModal extends Component {

  constructor (props) {
    super(props)
    this.state = {
      studentSuggestions:[],
      studentsWitExtensions:[]
    }
    this.addStudentExtension = this.addStudentExtension.bind(this)

  }

  componentDidMount() {
    let extensions = []
    this.props.students.forEach( (sid) =>{
      const user = Meteor.users.findOne(sid)
      const name = user ? user.getName() +"("+user.getEmail()+")" : 'Unknown'
      extensions.push({ value: sid, label: name })
    })
    this.setState({ studentSuggestions:extensions })
  }

  componentWillReceiveProps (nextProps) {
    let extensions = []
    nextProps.students.forEach( (sid) =>{
      const user = Meteor.users.findOne(sid)
      const name = user ? user.getName() +"("+user.getEmail()+")" : 'Unknown'
      extensions.push({ value: sid, label: name })
    })
    this.setState({ studentSuggestions:extensions })
  }


  addStudentExtension (obj) {
    let extensions = this.state.studentsWitExtensions
    extensions.push(obj.value)
    this.setState({ studentsWitExtensions:extensions })
  }


  render () {
    console.log(this.props.students)
    console.log("with extensions")
    console.log(this.state.studentsWitExtensions)

    const extensions = this.props.session.quizExtensions ? this.props.session.quizExtensions : []

    return (<div className='ql-modal-container'>
      <div className='ql-modal ql-card'>
        <div className='ql-modal-header ql-header-bar'><h3>Quiz extensions</h3></div>

        <div className='ql-qExtension-container container'>

          <div className='row'>
            <div className='col-md-6 left-column'>
              <div className='ql-qExtension-add'>
                Add a student:
                <Select
                  name='student-select'
                  placeholder='Type to add a student'
                  options={this.state.studentSuggestions}
                  onChange={this.addStudentExtension}
                  />
              </div>
            </div>

          </div>

          <div className='row'>
            <div className='ql-qExtension-list'>
              List of students:
              { this.state.studentsWitExtensions.map( (sid) => {
                  const user = Meteor.users.findOne(sid)
                  const name = user ? user.getName() : 'Unknown'
                  console.log("rendering line for "+name)
                  return (
                    <div key={sid}>
                      {name}
                    </div>
                  )
                })
              }
            </div>

          </div>
        </div>


        <div className='ql-buttongroup'>
          <a className='btn btn-default' onClick={this.props.done}>Done</a>
        </div>
      </div>
    </div>)
  } //  end render

} // end courseoptions modal

export const QuizExtensionsModal = createContainer((props) => {
  //const handle = Meteor.subscribe('sessions', {isInstructor: props.isInstructor})

  const handle =  Meteor.subscribe('users.studentsInCourse', props.session.courseId) &&
                  Meteor.subscribe('courses.single',props.session.courseId)
  const course = Courses.findOne({ _id: props.session.courseId})
  const students = course && course.students ? course.students : []
  return {
    students: students,
    loading: !handle.ready()
  }
}, _QuizExtensionsModal)

QuizExtensionsModal.propTypes = {
  done: PropTypes.func.isRequired,
  session: PropTypes.object.isRequired,
}
