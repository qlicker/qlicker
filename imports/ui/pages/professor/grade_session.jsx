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
import { Responses, responseDistribution } from '../../../api/responses'

import { WysiwygHelper } from '../../../wysiwyg-helpers'

import { ResponseList } from '../../ResponseList'
import { QuestionDisplay } from '../../QuestionDisplay'

class _GradeSession extends Component {

  constructor (props) {
    super(props)

    this.state = {
      studentToView: null,
      studentSearchString: '',
      answerSearchString: '',
      groupCategory: null, // if searching by category of group
      group: null, // if searching by students
      questionToView: null,
      questionIndex: 0,
      questionPoints: 0
    }

    this.setStudentSearchString = this.setStudentSearchString.bind(this)
    this.setAnswerSearchString = this.setAnswerSearchString.bind(this)
    this.setStudentToView = this.setStudentToView.bind(this)
    this.setCategory = this.setCategory.bind(this)
    this.setGroup = this.setGroup.bind(this)
    this.incrementQuestion = this.incrementQuestion.bind(this)
    this.calculateGrades = this.calculateGrades.bind(this)
    this.assignMark = this.assignMark.bind(this)

  }
  componentDidMount() {
    const firstQ = this.props.questions && this.props.questions.length > 0
      ? this.props.questions[0]
      : null
    const qpoints = firstQ ? firstQ.sessionOptions.points : 0
    this.setState({questionToView: firstQ, questionPoints: qpoints })
  }

  componentWillReceiveProps(nextProps) {
    if(!this.state.questionToView || nextProps.session._id != this.props.session._id){
      const firstQ = nextProps.questions && nextProps.questions.length > 0
      ? nextProps.questions[0]
      : null
      const qpoints = firstQ ? firstQ.sessionOptions.points : 0
      this.setState({ questionToView: firstQ , questionPoints: qpoints})
    }
  }

  setStudentSearchString (e) {
    this.setState({ studentSearchString: e.target.value })
  }

  setAnswerSearchString (e) {
    this.setState({ answerSearchString: e.target.value })
  }

  // Assign the same grade to all selected students
  assignMark (selectedStudents) {
    if (confirm('Are you sure you want to update all grades?')) {
      selectedStudents.forEach( (student) => {
        const grade = _(this.props.grades).findWhere({ userId:student._id })
        if (grade){
          Meteor.call('grades.setMarkPoints', grade._id, this.state.questionToView._id, this.state.questionPoints, (e) => {
            if (e) alertify.error("Error updating grade")
            else alertify.success("Updated grade for "+student.profile.firstname)
          })
        }
      })
    }
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

  incrementQuestion (increment) {
    const newIndex = this.state.questionIndex + increment
    if (newIndex < this.props.questions.length && newIndex >= 0) {
      const nextQuestion = this.props.questions[newIndex ]
      this.setState({ questionToView: nextQuestion, questionIndex: newIndex, studentToView: null , questionPoints: nextQuestion.sessionOptions.points})
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

    if(!this.state.questionToView) return <div className='ql-subs-loading'>Loading</div>

    const allStudents = this.props.students
    //These are defined to not have this in the filter function to limit students.
    const studentSearchString = this.state.studentSearchString
    const answerSearchString = this.state.answerSearchString
    const questionToViewId = this.state.questionToView._id

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

    // Easier not to use this in the filter function (or have to bind this)
    let studentsToShow = studentSearchString || answerSearchString
      ? _(studentPool).filter((entry) => {

        const hasResponse = answerSearchString ? entry.responses[questionToViewId].toLowerCase().includes(answerSearchString.toLowerCase()) : true

        const hasName = studentSearchString ? (entry.profile.lastname.toLowerCase().includes(studentSearchString.toLowerCase()) ||
                                               entry.profile.firstname.toLowerCase().includes(studentSearchString.toLowerCase()) ||
                                               entry.emails[0].address.toLowerCase().includes(studentSearchString.toLowerCase())) : true

        return hasName && hasResponse
      })
      : studentPool

    studentsToShow = _(studentsToShow).sortBy((entry) => { return entry.profile.lastname.toLowerCase() })

    let studentToView = this.state.studentToView
    if (!studentToView && studentsToShow.length > 0) studentToView = studentsToShow[0]

    const incrementQuestion = () => this.incrementQuestion(1)
    const decrementQuestion = () => this.incrementQuestion(-1)
    const assignMark = () => this.assignMark(studentsToShow)

    const setQuestionPoints = (e) => {this.setState({ questionPoints: parseFloat(e.target.value) })}

    const responseStats = this.props.responseStatsByQuestion[this.state.questionToView._id]
    const clearSearch = () => { this.setState({ studentSearchString:'', answerSearchString:'' })}

    // TODO: Should have className affix just under the col-md-3
    return (
      <div className='ql-grading-container container'>
        <div className='row'>
          <div className='col-md-3'>
            <div >
              <div className='ql-student-selector'>
                <div className='ql-student-header'>
                  <div className='ql-grading-header-student-title'>
                  Select student(s) to grade
                  </div>
                </div>
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
                    <div>
                      <input type='text' value = {this.state.studentSearchString} onChange={_.throttle(this.setStudentSearchString, 200)} placeholder='Search by student name or email' />
                      <input type='text' value = {this.state.answerSearchString} onChange={_.throttle(this.setAnswerSearchString, 200)} placeholder='Search by response content' />
                      { this.state.studentSearchString || this.state.answerSearchString ?
                        <div className='btn-group btn-group-justified'>
                          <div className='btn-group'>
                            <button className='btn btn-secondary' onClick={clearSearch}> Clear filters </button>
                          </div>
                        </div>
                        : ''
                      }

                    </div>
                  </div>
                  <div className='ql-simple-studentlist'>
                    { studentToView
                      ? <div className='ql-simple-studentlist-info'>
                          {studentToView.profile.lastname}, {studentToView.profile.firstname}
                      </div>
                      : 'Select a student'
                    }
                    <div className='ql-simple-studentlist-student-container'>
                      { studentsToShow.map((student) => {
                        const onClick = () => this.setStudentToView(student)
                        let className = 'ql-simple-studentlist-student'
                        const studentGrade = _(this.props.grades).findWhere({ userId: student._id })
                        const studentMark = _(studentGrade.marks).findWhere({ questionId: this.state.questionToView._id })
                        if (studentGrade && (!studentMark || !studentMark.needsGrading)) className += ' green'
                        if (studentGrade && studentMark.needsGrading) className += ' red'
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
            <div className='ql-grading-question-responses'>
              <div className='ql-grading-header'>
                <div className='ql-grading-header-title'>

                   {this.props.session.name}: Question {this.state.questionIndex + 1} of {this.props.questions.length}

                </div>
                { this.state.questionToView
                  ? <div className='ql-grading-header-question-preview'>
                      <QuestionDisplay question={this.state.questionToView} responseStats={responseStats} forReview showStatsOverride readonly prof />
                    </div>
                  : ''
                }
                <div className='ql-grading-header-qControls'>

                  <div className='ql-review-qControl-controls'>
                    <div className='btn-group btn-group-justified'>
                      <div className='btn-group'>
                        <button className='btn btn-primary' onClick={decrementQuestion} disabled={this.state.questionIndex <= 0}>
                            <span className='glyphicon glyphicon-chevron-left' /> Previous question
                        </button>
                      </div>
                      <div className='btn-group'>
                        <button className='btn btn-primary' onClick={incrementQuestion} disabled={this.state.questionIndex >= this.props.questions.length - 1}>
                            Next question <span className='glyphicon glyphicon-chevron-right' />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='ql-grading-header-qInfo'>
                  Assign same grade to all students &nbsp;
                  <input type='number' className='numberField' min='0' max={100} step={0.5} value={this.state.questionPoints} onChange={setQuestionPoints} maxLength='4' size='3' />
                  &nbsp;<button className='btn btn-secondary' onClick={assignMark}> Assign to all selected students </button>
                </div>

              </div>

              <div className='ql-response-list-container'>
                <ResponseList
                  sessionId={this.props.session._id}
                  questionId={this.state.questionToView._id}
                  qtype={this.state.questionToView.type}
                  students={studentsToShow}
                  studentToView={this.state.studentToView}
                />
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
                 Meteor.subscribe('questions.forReview', props.sessionId),
                 Meteor.subscribe('responses.forSession', props.sessionId)

  const course = Courses.findOne({ _id: props.courseId })
  const session = Sessions.findOne({ _id: props.sessionId })
  const grades = Grades.find({ sessionId: props.sessionId }).fetch()
  const allResponses = Responses.find({questionId: { $in: session.questions }}).fetch()

  const studentIds = session.joined || [] //course.students || []
  const students = Meteor.users.find({ _id: { $in: studentIds } }).fetch()

  let questions = Questions.find({_id: { $in: session.questions }}).fetch()
  let sortedQuestions = []
  for(let i = 0; i<session.questions.length ; i++){
    sortedQuestions.push( _(questions).findWhere({_id:session.questions[i]}) )
  }


  const responsesByQuestion = _(allResponses).groupBy('questionId')
  let responseStatsByQuestion = {}

  questions.forEach((question) => {
    const maxAttempt = _(_(allResponses).where({ questionId: question._id })).max((r) => {return r.attempt})['attempt']
    responseStatsByQuestion[question._id] = _(responseDistribution(responsesByQuestion[question._id], question)).where({ attempt:maxAttempt })
  })

  students.forEach((stu) => {
    stu.responses = {}
    questions.forEach((question) => {
      const sturesp = _(_(allResponses).where({ questionId: question._id, studentUserId:stu._id })).max((r) => {return r.attempt})
      stu.responses[question._id] = question.type === 2 ? sturesp['answerWysiwyg'] : sturesp['answer']

      if (stu.responses[question._id] && stu.responses[question._id].constructor === Array ) {
        stu.responses[question._id] = _(stu.responses[question._id]).sortBy((entry) => { return entry.toLowerCase() }).join("")
      }
    })
  })

  return {
    loading: !handle.ready(),
    grades: grades,
    students: students,
    course: course,
    session: session,
    questions: sortedQuestions,
    responseStatsByQuestion: responseStatsByQuestion
  }
}, _GradeSession)

GradeSession.propTypes = {
  sessionId: PropTypes.string,
  courseId: PropTypes.string
}
