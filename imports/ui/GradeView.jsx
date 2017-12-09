// QLICKER
// Author: Ryan Martin (ryanmartinneutrino@gmail.com)
//
// GradeViewModal

import React, { PropTypes, Component } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

// import { ControlledForm } from './ControlledForm'
import { Sessions } from '../api/sessions'
import { Questions } from '../api/questions'
import { Responses } from '../api/responses'
import { Grades } from '../api/grades'

import { QuestionWithResponse } from './QuestionWithResponse'

import { ROLES, QUESTION_TYPE, isAutoGradeable, QUESTION_TYPE_STRINGS_SHORT } from '../configs'


export class _GradeView extends Component {

  constructor (props) {
    super(props)

    const firstQ = this.props.questions.length > 0
      ? this.props.questions[0]
      : null

    const responsesToView = firstQ
      ? _(this.props.responses).where({ questionId: firstQ._id })
      : null

    this.state = {
      previewQuestion: false, // show a question in the preview
      questionToView: firstQ, // the question to show in preview
      responsesToView: responsesToView, // array of responses to view in question preview
      markToEdit: 0, // id of question for which to change the marks
      newMarkPoints: 0, // new value of marks for that question
      editGrade: false, // wheter grade should be edited
      newGradeValue: 0, // new value of the grade
    }

    this.setPreviewQuestion = this.setPreviewQuestion.bind(this)
    this.togglePreviewQuestion = this.togglePreviewQuestion.bind(this)
    this.toggleMarkEditable = this.toggleMarkEditable.bind(this)
    this.toggleGradeEditable = this.toggleGradeEditable.bind(this)
    this.setMarkPoints = this.setMarkPoints.bind(this)
    this.updateMark = this.updateMark.bind(this)
    this.setGradeValue = this.setGradeValue.bind(this)
    this.updateGrade = this.updateGrade.bind(this)
    this.autogradeGrade = this.autogradeGrade.bind(this)
    this.autogradeMark = this.autogradeMark.bind(this)
    this.handleGradeSubmit = this.handleGradeSubmit.bind(this)
    this.handleMarkSubmit = this.handleMarkSubmit.bind(this)
  }

  // set which question to show in the preview
  setPreviewQuestion (question = null) {
    const responsesToView = question
      ? _(this.props.responses).where({ questionId: question._id })
      : null
    this.setState({ previewQuestion:true, questionToView: question, responsesToView: responsesToView })
  }

  // toggle whether to show a question in the preview
  togglePreviewQuestion () {
    this.setState({ previewQuestion:!this.state.previewQuestion })
  }

  // toggle whether to make one of the marks editable (set to 0 to make non editable)
  toggleMarkEditable (qId) {
    this.setState({ markToEdit:qId })
  }

  toggleGradeEditable () {
    this.setState({ editGrade:!this.state.editGrade })
  }


  setMarkPoints (e) {
    newPoints = Number(e.target.value)
    this.setState({ newMarkPoints:newPoints })
  }

  setGradeValue (e) {
    newValue = Number(e.target.value)
    this.setState({ newGradeValue:newValue })
  }

  updateMark (qId, points) {
    Meteor.call('grades.setMarkPoints', this.props.grade._id, qId, points, (err) => {
      if (err) return alertify.error('Error: ' + err.error)
      alertify.success('Mark updated')
      //this.setState({ grade:grade })
      this.toggleMarkEditable(0)
    })
  }

  updateGrade (value) {
    Meteor.call('grades.setGradeValue', this.props.grade._id, value, (err) => {
      if (err) return alertify.error('Error: ' + err.error)
      alertify.success('Grade updated')
      //this.setState({ grade:grade })
      this.toggleGradeEditable()
    })
  }

  handleGradeSubmit (e) {
    e.preventDefault()
    this.updateGrade(this.state.newGradeValue)
  }

  handleMarkSubmit (e) {
    e.preventDefault()
    this.updateMark(this.state.markToEdit, this.state.newMarkPoints)
  }

  autogradeMark (qId) {
    Meteor.call('grades.setMarkAutomatic', this.props.grade._id, qId, (err) => {
      if (err) return alertify.error('Error: ' + err.error)
      alertify.success('Mark updated')
    })
  }

  autogradeGrade () {
    Meteor.call('grades.setGradeAutomatic', this.props.grade._id, (err) => {
      if (err) return alertify.error('Error: ' + err.error)
      alertify.success('Grade updated')
    })
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    const grade = this.props.grade
    const student = this.props.student
    const user =  Meteor.user()
    const canEdit = user.hasGreaterRole(ROLES.admin) || user.isInstructor(this.props.courseId)
    const gradeAutoText =  grade.automatic ? "(auto-graded)": "(manually overridden)"
    const gradeInfoClass =  grade.automatic ? 'ql-gradeview-gradeinfo' : 'ql-gradeview-gradeinfo ql-gradeview-manual'

    const toggleGradeEditable = () => this.toggleGradeEditable()
    const updateGrade = () => this.updateGrade(this.state.newGradeValue)

    let questionCount = 0
    return (grade
            ? <div className='ql-gradeview'>

               <div className='ql-gradeview-summary'>
                 {this.state.editGrade
                  ?  <form className={gradeInfoClass}  ref='editGradeForm' onSubmit={this.handleGradeSubmit} >
                     Grade:
                     <input type='text' onChange={this.setGradeValue} maxLength="4" size="4" placeholder={grade.value}></input>
                     % ({grade.points} out of {grade.outOf} {gradeAutoText})
                      &nbsp; <a onClick={updateGrade}>submit</a>
                      &nbsp;&nbsp;<a onClick={toggleGradeEditable}>cancel</a>
                    </form>
                  : <div className={gradeInfoClass} >
                       <div >
                       Grade: {grade.value.toFixed(1)}% ({grade.points} out of {grade.outOf}) {gradeAutoText}
                       </div>
                       {canEdit
                         ? <div>
                             &nbsp;&nbsp;<a onClick={toggleGradeEditable}>edit</a>
                             { !grade.automatic
                               ? <div>&nbsp;&nbsp; <a onClick={this.autogradeGrade}>auto-grade</a> </div>
                               : ''
                             }
                           </div>
                         : ''
                       }
                    </div>
                 }
                Participation: {grade.participation.toFixed(1)}% ({grade.joined ? "joined" : "did not join" }) <br />
                Questions answered total: {grade.numAnsweredTotal} (out of {grade.numQuestionsTotal}) <br />
                Questions worth points answered: {grade.numAnswered} (out of {grade.numQuestions})  <br />
            </div>

            <div className='ql-gradeview-questionlist'>
                 {grade.marks.map((mark) => {
                  questionCount +=1
                  let autoText = mark.automatic ? "(auto-graded)": "(manually graded)"
                  const infoClass =  mark.automatic ? 'ql-gradeview-question-info' : 'ql-gradeview-question-info ql-gradeview-manual'

                  const question = _(this.props.questions).findWhere({ _id:mark.questionId })
                  const autoGradeable = question && isAutoGradeable(question.type)

                  const offerToAutograde = autoGradeable && !mark.automatic
                  const responses = _(this.props.responses).where({ questionId:mark.questionId })
                  if (!responses || responses.length < 1){
                    autoText = "(no response)"
                  }

                  const previewQuestion = () => this.setPreviewQuestion(question)
                  const toggleMarkEditable = () => this.toggleMarkEditable(mark.questionId)
                  const cancelEditing = () => this.toggleMarkEditable(0)
                  const udpateMark = () => this.updateMark(mark.questionId, this.state.newMarkPoints)
                  const autogradeMark = () => this.autogradeMark(mark.questionId)


                  return ( <div key={mark.questionId} className='ql-gradeview-question'>
                     <div className='ql-gradeview-question-preview' onClick={previewQuestion}>
                       Question {questionCount} ({QUESTION_TYPE_STRINGS_SHORT[question.type]})
                     </div>
                     &nbsp;&nbsp;
                     <div className={infoClass}>
                       { (this.state.markToEdit === mark.questionId) && canEdit
                         ? <form  ref='editMarkForm' onSubmit={this.handleMarkSubmit}>
                            <input type='text' onChange={this.setMarkPoints} maxLength="4" size="4" placeholder={mark.points.toFixed(2)}></input>
                            out of {mark.outOf} on attempt {mark.attempt} {autoText} &nbsp; <a onClick={udpateMark}>submit</a>
                            &nbsp;&nbsp;<a onClick={cancelEditing}>cancel</a>
                           </form>

                         : <div>
                           {mark.points.toFixed(2)} out of {mark.outOf} on attempt {mark.attempt} {autoText}&nbsp;
                             { canEdit
                                ? <div>
                                    <a onClick={toggleMarkEditable}>edit</a>
                                    { offerToAutograde
                                    ?  <div>&nbsp;&nbsp; <a onClick={autogradeMark}> auto-grade</a> </div>
                                    : ''
                                    }
                                  </div>
                                : ''
                             }
                           </div>
                      }
                    </div>
                   </div>)
                })
                }
            </div>
              <a  onClick={this.togglePreviewQuestion}>
                {
                this.state.previewQuestion ? 'Hide attempts': 'Show attempts'
                }
              </a>

              { this.state.previewQuestion
                ? <div>
                     <QuestionWithResponse question={this.state.questionToView} responses={this.state.responsesToView} />
                     <a  onClick={this.togglePreviewQuestion}>Hide attempts</a>
                  </div>
                : ''
              }
        </div>
      : 'Loading')
  } //  end render

} // end GradeView

// meteor reactive data container
export const GradeView = createContainer((props) => {
  const courseId = props.grade.courseId
  const sessionId = props.grade.sessionId
//  const grade = props.grade
  const handle = Meteor.subscribe('users.myStudents', {cId: courseId}) &&
                 Meteor.subscribe('questions.inSession', sessionId) &&
                 Meteor.subscribe('sessions') &&
                 Meteor.subscribe('responses.forSession', sessionId) &&
                 Meteor.subscribe('grades.single', props.grade._id)


  const session = Sessions.findOne({ _id:sessionId })
  const grade = Grades.findOne({ _id: props.grade._id})
  const student = props.student
                    ? props.student
                    : Meteor.users.findOne({ _id:props.grade.userId })


  // overkill to sort the questions...
  let questions = []
  session.questions.forEach( (qId) => {
    questions.push( Questions.findOne({ _id:qId }) )
  })
  const questionIds = _(questions).pluck("_id")
  const responses = Responses.find({ questionId: { $in:questionIds }, studentUserId:props.grade.userId }, { sort: { attempt: 1 } }).fetch()

  return {
    loading: !handle.ready(),
    grade: grade,
    student: student,
    questions: questions,
    responses: responses,
    courseId: courseId
  }
}, _GradeView)

GradeView.propTypes = {
  grade: PropTypes.object,
  student: PropTypes.object
}
