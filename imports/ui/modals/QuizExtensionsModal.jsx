// QLICKER
// Author: Enoch T <me@enocht.am>
//
// CreateCourseModal.jsx

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import _ from 'underscore'
import Select from 'react-select'
import 'react-select/dist/react-select.css'

import moment from 'moment-timezone'
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
    this.saveChanges = this.saveChanges.bind(this)
    this._DB_saveChanges = _.debounce(this.saveChanges, 200)
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
    let studentExtensions = _(this.state.studentExtensions).reject(function (ext){return ext.userId == sid} )
    let suggestions = this.state.studentSuggestions
    const user = Meteor.users.findOne(sid)
    const name = user ? user.getName() +" ("+user.getEmail()+")" : 'Unknown'
    suggestions.push({value:sid, label:name})
    this.setState({ studentExtensions:studentExtensions, studentSuggestions:suggestions }, this._DB_saveChanges())
  }

  addStudentExtension (obj) {
    let studentExtensions = this.state.studentExtensions
    studentExtensions.push({userId:obj.value, quizStart:this.props.session.quizStart, quizEnd:this.props.session.quizEnd} )
    let suggestions = _(this.state.studentSuggestions).reject( function(sug) { return sug.value == obj.value })

    this.setState({ studentExtensions:studentExtensions, studentSuggestions:suggestions }, this._DB_saveChanges())
  }

  setQuizStartTime (sid, amoment) {
    const isMoment = amoment instanceof moment
    let quizStart = isMoment ? amoment.toDate() : (amoment ? amoment  : null)

    let studentExtensions = this.state.studentExtensions
    let index = _(studentExtensions).findIndex( (ext)=>{return ext.userId == sid })

    studentExtensions[index].quizStart = quizStart
    if(!isMoment){
      this.setState({ studentExtensions: studentExtensions}, this._DB_saveChanges())
      return
    }
    // If the user set the start time after the end time, push the end time to one hour after start time
    if (!studentExtensions[index].quizEnd || amoment.isAfter(studentExtensions[index].quizEnd)){
      alertify.error("pushing back end time")
      studentExtensions[index].quizEnd  = amoment.add(1,'hour').toDate()
    }
    this.setState({ studentExtensions: studentExtensions}, this._DB_saveChanges())
  }

  setQuizEndTime (sid, amoment) {
    const isMoment = amoment instanceof moment
    let quizEnd = isMoment ? amoment.toDate() : (amoment ? amoment  : null)

    let studentExtensions = this.state.studentExtensions
    let index = _(studentExtensions).findIndex( (ext)=>{return ext.userId == sid })

    studentExtensions[index].quizEnd = quizEnd
    if(!isMoment){
      this.setState({ studentExtensions: studentExtensions}, this._DB_saveChanges())
      return
    }
    // If the user set the end time before the start time move up the start time
    if (!studentExtensions[index].quizStart || amoment.isBefore(studentExtensions[index].quizStart)){
      alertify.error("Warning: changing start time!")
      studentExtensions[index].quizStart  = amoment.subtract(1,'hour').toDate()
    }
    this.setState({ studentExtensions: studentExtensions}, this._DB_saveChanges())
  }

  saveChanges (){
    Meteor.call('sessions.updateQuizExtensions', this.props.session._id, this.state.studentExtensions, (err) => {
     if (err) return alertify.error('Error: ' + err.message)
     alertify.success('Changes saved')
    })
  }

  render () {
    if (this.props.loading ) return <div className='ql-subs-loading'>Loading</div>
    const extensions = this.props.session.quizExtensions ? this.props.session.quizExtensions : []

    return (<div className='ql-modal-container'>
      <div className='ql-modal ql-card'>
        <div className='ql-modal-header ql-header-bar'><h3>Quiz extensions</h3></div>

        <div className='ql-qExtension-container container'>

          <div className='row'>
            <div className='col-sm-4'>
              <div className='ql-qExtension-add'>
                <div className='ql-qExtension-add-title'>
                  Add an extension for a student
                </div>
                <Select
                  name='student-select'
                  placeholder='Type name or email to add a student'
                  options={this.state.studentSuggestions}
                  onChange={this.addStudentExtension}
                  />
              </div>
            </div>

          </div>

          <div className='row'>
            <div className='col-sm-6'>
              { this.state.studentExtensions.length > 0 ?
                <div>
                  <div className='ql-qExtension-list-title'>
                    Students with extensions:
                  </div>
                  <div className='ql-qExtension-headers'>
                    <div className='ql-header-name'>
                      Name
                    </div>
                    <div className='ql-header-date'>
                      Quiz start
                    </div>
                    <div className='ql-header-date'>
                      Quiz end
                    </div>
                    <div className='ql-header-note'>
                      Notes
                    </div>
                  </div>
                  <div className='ql-qExtension-list'>
                    { this.state.studentExtensions.map( (extObj) => {
                        const sid = extObj.userId
                        const user = Meteor.users.findOne(sid)
                        const name = user ? user.getName() +" ("+user.getEmail()+")" : 'Unknown'
                        const setQuizStartTime = (mom) => this.setQuizStartTime(sid,mom)
                        const setQuizEndTime = (mom) => this.setQuizEndTime(sid,mom)
                        const removeMe = () => this.removeStudentExtension(sid)
                        let note = ''
                        if (moment(extObj.quizStart).isBefore(moment(this.props.session.quizStart))){
                          note += 'Starts '+moment(this.props.session.quizStart).from(moment(extObj.quizStart), true)+ ' early'
                        }
                        if (moment(extObj.quizEnd).isAfter(moment(this.props.session.quizEnd))){
                          note += ' Ends '+moment(extObj.quizEnd ).from(moment(this.props.session.quizEnd), true)+ ' later'
                        }

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
                                       value={extObj.quizStart ? extObj.quizStart : null}
                                     />
                            </div>
                            <div className='ql-qExtension-date'>
                              <Datetime
                                       onChange={setQuizEndTime}
                                       value={extObj.quizEnd ? extObj.quizEnd : null}
                                     />
                            </div>
                            <div className='ql-qExtension-note'>
                              {note}
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
                : <div className='ql-qExtension-list'>
                    <div className='ql-qExtension-list-title'>
                      No students with extensions
                    </div>
                  </div>
              }

            </div>
          </div>
        </div>
        <div className='ql-qExtension-button'>
          <div className='ql-buttongroup'>
            <a className='btn btn-default' onClick={this.props.done}>Done</a>
          </div>
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
