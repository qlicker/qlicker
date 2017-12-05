// QLICKER
// Author: Ryan Martin (ryanmartinneutrino@gmail.com)
//
// GradeViewModal

import React, { PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import { ControlledForm } from '../ControlledForm'
import { Sessions } from '../../api/sessions'
import { Questions } from '../../api/questions'
import { Responses } from '../../api/responses'
import { Grades } from '../../api/grades'

import { QuestionWithResponse } from '../QuestionWithResponse'

import { ROLES, QUESTION_TYPE } from '../../configs'

/**
 * modal dialog to prompt for new email addresss
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
export class _GradeViewModal extends ControlledForm {

  constructor (props) {
    super(props)

    const firstQ = this.props.questions.length > 0
      ? this.props.questions[0]
      : null

    const responsesToView = firstQ
      ? _(this.props.responses).where({ questionId: firstQ._id })
      : null

    this.state = {
      previewQuestion: false,
      questionToView: firstQ,
      responsesToView: responsesToView,
      markToEdit: 0,
      newMarkPoints: 0,
      grade: this.props.grade,
      editGrade: false,
      newGradeValue: 0,
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
    this.autogradeMark = this.autogradeMark
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

// TODO: Add an option to auto-grade if it was manually graded!
// TODO: Add an option to edit the overal grade
  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    const grade = this.props.grade
    const student = this.props.student
    const user =  Meteor.user()
    const canEdit = user.hasGreaterRole(ROLES.admin) || user.isInstructor(this.props.courseId)
    const gradeAutoText =  grade.automatic ? "(auto-graded)": "(manually overridden)"

    const toggleGradeEditable = () => this.toggleGradeEditable()
    const updateGrade = () => this.updateGrade(this.state.newGradeValue)

    let questionCount = 0
    return ( grade ?
       <div className='ql-modal-container'  >
          <div className='ql-modal ql-card' >
            <div className='ql-modal-header ql-header-bar'><h3>{grade.name} {student.profile.lastname}, {student.profile.firstname}</h3> </div>
            <div className='ql-card-content'>
              <div className='row'>

                <div className='ql-modal-gradeview'>
                    {this.state.editGrade
                    ?  <form  ref='editGradeForm' >
                       Grade:
                       <input type='text' onChange={this.setGradeValue} maxLength="4" size="4" placeholder={grade.value}></input>
                       % ({grade.points} out of {grade.outOf} {gradeAutoText})
                        &nbsp; <a onClick={updateGrade}>submit</a>
                        &nbsp;&nbsp;<a onClick={toggleGradeEditable}>cancel</a>
                      </form>
                    : <div className='ql.same-row'>
                         Grade: {grade.value}% ({grade.points} out of {grade.outOf}) {gradeAutoText}
                         {canEdit
                           ? <div className='ql.same-row'>
                               <a onClick={toggleGradeEditable}>edit</a>
                               { !grade.automatic
                                 ? <div> &nbsp;&nbsp; <a onClick={this.autogradeGrade}>auto-grade</a></div>
                                : ''
                               }
                             </div>
                           : ''
                         }
                      </div>
                  }
                  Participation: {grade.participation}% ({grade.joined ? "joined" : "did not join" }) <br />
                  Questions answered total: {grade.numAnsweredTotal} (out of {grade.numQuestionsTotal}) <br />
                  Questions worth points answered: {grade.numAnswered} (out of {grade.numQuestions})  <br />
                  Questions: <br />
                  {
                    grade.marks.map((mark) => {
                      questionCount +=1
                      let autoText = mark.automatic ? "(auto-graded)": "(manually graded)"
                      const question = _(this.props.questions).findWhere({ _id:mark.questionId })
                      const autoGradeable = question && (question.type === QUESTION_TYPE.MC ||
                                                         question.type === QUESTION_TYPE.TF ||
                                                         question.type === QUESTION_TYPE.MS)

                      const offerToAutograde = autoGradeable && !mark.automatic
                      const responses = _(this.props.responses).where({ questionId:mark.questionId })
                      if (!responses || responses.length < 1){
                        autoText = "(no response)"
                      }

                      const onClick = () => this.setPreviewQuestion(question)
                      const toggleMarkEditable = () => this.toggleMarkEditable(mark.questionId)
                      const cancelEditing = () => this.toggleMarkEditable(0)
                      const udpateMark = () => this.updateMark(mark.questionId, this.state.newMarkPoints)
                      const autogradeMark = () => this.autogradeMark(mark.questionId)

                      return ( <div key={mark.questionId} className='ql-gradeview-question'>
                         <div className='ql-gradeview-question-preview' onClick={onClick}>
                           Question {questionCount} :
                         </div>
                         <div className='ql-gradeview-question-points'>
                           { (this.state.markToEdit === mark.questionId) && canEdit
                             ? <form  ref='editMarkForm' >
                                <input type='text' onChange={this.setMarkPoints} maxLength="4" size="4" placeholder={mark.points}></input>
                                out of {mark.outOf} on attempt {mark.attempt} {autoText} &nbsp; <a onClick={udpateMark}>submit</a>
                                &nbsp;&nbsp;<a onClick={cancelEditing}>cancel</a>
                               </form>

                             : <div>
                                &nbsp;&nbsp;{mark.points} out of {mark.outOf} on attempt {mark.attempt} {autoText}&nbsp;
                                 { canEdit
                                    ? <div>
                                        <a onClick={toggleMarkEditable}>edit</a>
                                        { offerToAutograde
                                        ? <a onClick={autogradeMark}> auto-grade</a>
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
                  <div className='btn-group btn-group-justified' role='group' aria-label='...'>
                    <a className='btn btn-default' onClick={this.togglePreviewQuestion}>{
                      this.state.previewQuestion ? 'Hide preview': 'Show preview'
                    }</a>
                  </div>
                  { this.state.previewQuestion
                    ? <QuestionWithResponse question={this.state.questionToView} responses={this.state.responsesToView} />
                    : ''
                  }
                <div className='btn-group btn-group-justified' role='group' aria-label='...'>
                  <a className='btn btn-default' onClick={this.props.done}>Close</a>
                </div>
              </div>
              </div>
             </div>
            </div>
        </div>
      : 'Loading')
  } //  end render

} // end profileViewModal

// meteor reactive data container
export const GradeViewModal = createContainer((props) => {
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
  const student = Meteor.users.findOne({ _id:props.grade.userId })

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
}, _GradeViewModal)

GradeViewModal.propTypes = {
  done: PropTypes.func,
  grade: PropTypes.object
}
