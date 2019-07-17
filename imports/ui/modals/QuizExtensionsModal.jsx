// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CreateCourseModal.jsx

import React, { PropTypes, Component } from 'react'
import _ from 'underscore'
import Select from 'react-select'
import 'react-select/dist/react-select.css'
import Datetime from 'react-datetime'

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
      studentSuggestions:[], //suggestion of students that could receive an extension
      studentExtensions: [] //extensions ({userId, quizStart, quizEnd})
    }
    this.addStudentExtension = this.addStudentExtension.bind(this)
    this.removeStudentExtension = this.removeStudentExtension.bind(this)
    this.setQuizStartTime = this.setQuizStartTime.bind(this)
    this.setQuizEndTime = this.setQuizEndTime.bind(this)
  }

  componentDidMount() {
    //Initialize the list of suggested students for extensions, and those that already have extensions
    let suggestions = []
    //let extensions = []
    let studentExtensions = this.props.session.quizExtensions ? this.props.session.quizExtensions : []
    /*
    if (this.props.session.quizExtensions){
      this.props.session.quizExtensions.forEach( (extObj) => {
        extensions.push(extObj.userId)
      })
    }*/

    this.props.students.forEach( (sid) =>{
      //if ( _(extensions).indexOf(sid) == -1) {
      if ( _(studentExtensions).findWhere({ userId:sid }) === undefined ) {
        const user = Meteor.users.findOne(sid)
        const name = user ? user.getName() +" ("+user.getEmail()+")" : 'Unknown'
        suggestions.push({ value: sid, label: name })
      }
    })
    this.setState({ studentSuggestions:suggestions, studentExtensions:studentExtensions })
  }

  componentWillReceiveProps (nextProps) {
    //Update the list of suggested students for extensions, and those that already have extensions
    let suggestions = []
    let studentExtensions = nextProps.session.quizExtensions ? nextProps.session.quizExtensions : []
    nextProps.students.forEach( (sid) =>{
      //if ( _(extensions).indexOf(sid) == -1) {
      if ( _(studentExtensions).findWhere({ userId:sid }) === undefined ) {
        const user = Meteor.users.findOne(sid)
        const name = user ? user.getName() +" ("+user.getEmail()+")" : 'Unknown'
        suggestions.push({ value: sid, label: name })
      }
    })
    this.setState({ studentSuggestions:suggestions, studentExtensions:studentExtensions })
  }

  removeStudentExtension (sid) {
    let studentExtensions = _(this.state.studentExtensions).reject(function (ext){return ext.userId == sid} )//TODO Does this work??
    let suggestions = this.state.studentSuggestions
    const user = Meteor.users.findOne(sid)
    const name = user ? user.getName() +" ("+user.getEmail()+")" : 'Unknown'
    suggestions.push({value:sid, label:name})
    this.setState({ studentExtensions:studentExtensions, studentSuggestions:suggestions })
  }

  addStudentExtension (obj) {
    let studentExtensions = this.state.studentExtensions
    studentExtensions.push({userId:obj.value, quizStart:this.props.session.quizStart, quizEnd:this.props.session.quizEnd} )
    let suggestions = _(this.state.studentSuggestions).reject( function(sug) { return sug.value == obj.value })

    this.setState({ studentExtensions:studentExtensions, studentSuggestions:suggestions })
  }

  setQuizStartTime (sid, amoment) {
    console.log("start")
    console.log(sid,amoment)
  }

  setQuizEndTime (sid, amoment) {
    console.log("end")
    console.log(sid,amoment)
  }

  render () {
    if (this.props.loading ) return <div className='ql-subs-loading'>Loading</div>
    console.log(this.props.students)
    console.log("with extensions")
    console.log(this.state.studentExtensions)

    const extensions = this.props.session.quizExtensions ? this.props.session.quizExtensions : []

    return (<div className='ql-modal-container'>
      <div className='ql-modal ql-card'>
        <div className='ql-modal-header ql-header-bar'><h3>Quiz extensions</h3></div>

        <div className='ql-qExtension-container container'>

          <div className='row'>
            <div className='col-md-4 left-column'>
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
            <div className='col-md-6 left-column'>
              { this.state.studentExtensions.length > 0 ?
                <div className='ql-qExtension-list'>
                  <div className='ql-qExtension-list-title'>
                    Students with extensions:
                  </div>
                  { this.state.studentExtensions.map( (extObj) => {
                      const sid = extObj.userId
                      const user = Meteor.users.findOne(sid)
                      const name = user ? user.getName() +" ("+user.getEmail()+")" : 'Unknown'
                      const setQuizStartTime = (mom) => this.setQuizStartTime(sid,mom)
                      const setQuizEndTime = (mom) => this.setQuizEndTime(sid,mom)
                      const removeMe = () => this.removeStudentExtension(sid)
                      console.log("rendering line for "+name)
                      return (
                        <div className='ql-qExtension-student' key={sid}>
                          <div className='ql-qExtension-name'>
                            <div className='ql-qExtension-delete'>
                              <span className='glyphicon glyphicon-remove' onClick={removeMe}/>
                            </div>
                            {name}
                          </div>
                          <div className='ql-qExtension-date'>
                            <Datetime
                                     onChange={setQuizStartTime}
                                     value={extObj.quizEnd ? extObj.quizEnd : null}
                                   />
                          </div>
                          <div className='ql-qExtension-date'>
                            <Datetime
                                     onChange={setQuizEndTime}
                                     value={extObj.quizEnd ? extObj.quizEnd : null}
                                   />
                          </div>

                        </div>
                      )
                    })
                  }
                </div>
                : <div> No students with extensions </div>
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
