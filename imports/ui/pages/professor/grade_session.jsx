/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_course.jsx: page for managing a specific course

import React, { PropTypes, Component } from 'react'

import _ from 'underscore'

import { createContainer } from 'meteor/react-meteor-data'

import Select from 'react-select'
import 'react-select/dist/react-select.css'

import { Sessions } from '../../../api/sessions'
import { Courses } from '../../../api/courses'
import { Grades } from '../../../api/grades'
import { Questions } from '../../../api/questions'

import {ResponseList } from '../../ResponseList'

class _GradeSession extends Component {

  constructor (props) {
    super(props)
    
    const firstQ = this.props.questions && this.props.questions.length > 0
    ? this.props.questions[0]
    : null

    this.state = {
      studentToView: null,
      studentSearchString: '',
      groupCategory: null, // if searching by category of group
      group: null, // if searching by students
      questionToView: firstQ,
      questionIndex: 1
    }

    this.setStudentSearchString = this.setStudentSearchString.bind(this)
    this.setStudentToView = this.setStudentToView.bind(this)
    this.setCategory = this.setCategory.bind(this)
    this.setGroup = this.setGroup.bind(this)
    this.setQuestion = this.setQuestion.bind(this)
    this.calculateGrades = this.calculateGrades.bind(this)

  }

  setStudentSearchString (e) {
    this.setState({ studentSearchString: e.target.value })
  }

  setStudentToView (student) {
    this.setState({studentToView: student}) 
  }

  setCategory (option) {
    if (option) {
      const category = _(this.props.course.groupCategories).findWhere({ categoryNumber: option.value })
      this.setState({ groupCategory: category, group: category.groups[0], studentToView: null })
    } else {
      this.setState({ groupCategory: null, group: null, studentToView: null })
    }
  }

  setGroup (option) {
    // reset the student to view
    if (option && this.state.groupCategory) {
      const group = _(this.state.groupCategory.groups).findWhere({ groupNumber: option.value })
      if (group) this.setState({ group: group, studentToView: null })
    } else {
      this.setState({ group: null, studentToView: null })
    }
  }

  setQuestion (increment) {
    const newIndex = this.state.questionIndex + increment
    const nextQuestion = this.props.questions[newIndex - 1]
  
    if (newIndex <= this.props.questions.length && newIndex > 0) {
      this.setState({ questionToView: nextQuestion, questionIndex: newIndex, studentToView: null })
    }
  }

  calculateGrades () {
    if (confirm('Are you sure?')) {
      Meteor.call('grades.calcSessionGrades', this.props.session._id, (err) => {
        if (err) {
          alertify.error('Error: ' + err.error)
        } else {
          alertify.success('Grades calculated')
        }
      })
    }
  }

  componentWillReceiveProps(nextProps) {
    const firstQ = nextProps.questions && nextProps.questions.length > 0
    ? nextProps.questions[0]
    : null
    this.setState({ questionToView: firstQ }) 
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    if (!this.props.grades || this.props.grades.length < 1) {
      return (
        <div className='container ql-grade-session'>
          <div className='col-sm-4' />
          <div className='col-sm-4'>
            <div type='button' className='btn btn-secondary' onClick={this.calculateGrades}>
              Click to create the grade items for the session
            </div>
          </div>
          <div className='col-sm-3' />
        </div>
      )
    }

    const allStudents = this.props.students
    const studentSearchString = this.state.studentSearchString

    // Create the menu items for the selection of group Category and group
    let categoryOptions = []
    const groupCategories = this.props.course.groupCategories ? this.props.course.groupCategories : []

    groupCategories.forEach((category) => {
      categoryOptions.push({ value: category.categoryNumber,
        label: category.categoryName })
    })

    let groupOptions = []
    if (this.state.groupCategory) {
      this.state.groupCategory.groups.forEach((g) => {
        groupOptions.push({ value: g.groupNumber,
          label: g.groupName })
      })
    }

    // If a category of group and a group are chosen, then limit the students to those
    const studentsIDsInGroup = this.state.group ? this.state.group.students : []
    let studentsInGroup = []
    studentsIDsInGroup.forEach((id) => {
      if (this.props.students) {
        const student = _(this.props.students).findWhere({ _id: id })
        if (student) studentsInGroup.push(student)
      }
    })

    const studentPool = (this.state.group) ? studentsInGroup : allStudents

    let studentsToShow = studentSearchString
      ? _(studentPool).filter((entry) => {
        return entry.profile.lastname.toLowerCase().includes(studentSearchString.toLowerCase()) ||
               entry.profile.firstname.toLowerCase().includes(studentSearchString.toLowerCase()) ||
               entry.emails[0].address.toLowerCase().includes(studentSearchString.toLowerCase())
      })
      : studentPool

    studentsToShow = _(studentsToShow).sortBy((entry) => { return entry.profile.lastname.toLowerCase() })
    
    let studentToView = this.state.studentToView
    if (!studentToView && studentsToShow.length > 0) studentToView = studentsToShow[0]

    const incrementQuestion = () => this.setQuestion(1)
    const decrementQuestion = () => this.setQuestion(-1)
    
    return (
      <div className='container ql-grade-session'>
        <div className='row'>
          <div className='col-md-3'>
            <div className='ql-card'>
              <div className='ql-header-bar'>
                <h4> Select student to grade </h4>
              </div>
              <div className='ql-card-content'>
                <div className='ql-grade-session-student-search'>
                  <div className='ql-grade-session-student-search-controls'>
                    { categoryOptions.length
                      ? <div className='ql-grade-session-select'>
                        <Select
                          name='category-input'
                          placeholder='Search by group - type to choose category'
                          value={this.state.groupCategory ? this.state.groupCategory.categoryNumber : null}
                          options={categoryOptions}
                          onChange={this.setCategory}
                          />
                      </div>
                      : ''
                    }
                    { groupOptions.length
                      ? <div className='ql-grade-session-select'>
                        <Select
                          name='category-input'
                          placeholder={'Type to choose group in ' + this.state.groupCategory.categoryName}
                          value={this.state.group ? this.state.group.groupNumber : null}
                          options={groupOptions}
                          onChange={this.setGroup}
                          />
                      </div>
                      : ''
                    }
                    <input type='text' onChange={_.throttle(this.setStudentSearchString, 200)} placeholder='Search by student name or email' />
                  </div>
                  <div className='ql-simple-studentlist'>
                    { studentToView
                      ? <div className='ql-simple-studentlist-info'>
                          Current student: {studentToView.profile.lastname}, {studentToView.profile.firstname}
                      </div>
                      : 'Select a student'
                    }
                    <div className='ql-simple-studentlist-student-container'>
                      { studentsToShow.map((student) => {
                        const onClick = () => this.setStudentToView(student)
                        let className = 'ql-simple-studentlist-student'
                        const studentGrade = _(this.props.grades).findWhere({ userId: student._id })
                        if (studentGrade && studentGrade.hasManualMarks()) className += ' green'
                        if (studentGrade && studentGrade.hasUngradedMarks()) className += ' red'

                        if (studentToView && student._id === studentToView._id) className += ' selected'
                        return (
                          <div key={'s2' + student._id} className={className} onClick={onClick}>
                            {student.profile.lastname}, {student.profile.firstname}
                          </div>
                        )
                      })
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='col-md-9'>
            <div className='ql-card'>
              <div className='response-header'>
                <h2>
                  <span className='response-header-btn left' onClick={decrementQuestion}>&lt;</span>
                  <span className='respone-header-content'>Question {this.state.questionIndex}</span>
                  <span className='response-header-btn right' onClick={incrementQuestion}>&gt;</span>
                </h2>
              </div>
              <div className='ql-card-content'>
                <div className='ql-grade-session-gradeview'>
                  <ResponseList 
                    session={this.props.session} 
                    question={this.state.questionToView} 
                    students={studentsToShow}
                    studentToView={this.state.studentToView}
                    grades={this.props.grades} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }

}

export const GradeSession = createContainer((props) => {
  const handle = Meteor.subscribe('sessions.single', props.sessionId) &&
                 Meteor.subscribe('grades.forSession', props.sessionId) &&
                 Meteor.subscribe('courses.single', props.courseId) &&
                 Meteor.subscribe('users.studentsInCourse', props.courseId)
                 Meteor.subscribe('questions.forReview', props.sessionId) &&
                 Meteor.subscribe('responses.forSession', props.sessionId)

  const course = Courses.findOne({ _id: props.courseId })
  const session = Sessions.findOne({ _id: props.sessionId })
  const grades = Grades.find({ sessionId: props.sessionId }).fetch()

  const studentIds = course.students || []
  const students = Meteor.users.find({ _id: { $in: studentIds } }).fetch()

  let questions = Questions.find({_id: { $in: session.questions }}).fetch()

  return {
    loading: !handle.ready(),
    grades: grades,
    students: students,
    course: course,
    session: session,
    questions: questions
  }
}, _GradeSession)

GradeSession.propTypes = {
  sessionId: PropTypes.string,
  courseId: PropTypes.string
}
