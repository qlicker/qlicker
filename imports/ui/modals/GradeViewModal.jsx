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

/**
 * modal dialog to prompt for new email addresss
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
export class _GradeViewModal extends ControlledForm {

  constructor (props) {
    super(props)
    this.state = { QuestionDiplayModal: false}
    this.toggleQuestionDisplayModal = this.toggleQuestionDisplayModal.bind(this)
  }

  toggleQuestionDisplayModal (question = null) {
    this.setState({ QuestionDiplayModal: !this.state.QuestionDisplayModal, questionToView: question })
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    const grade = this.props.grade
    const student = this.props.student
    let questionCount = 0
    return ( grade ?
       <div className='ql-modal-container' onClick={this.props.done} >
          <div className='ql-modal ql-card' onClick={this.preventPropagation}>
            <div className='ql-modal-header ql-header-bar'><h3>{grade.name} {student.profile.lastname}, {student.profile.firstname}</h3> </div>
            <div className='ql-card-content'>
              <div className='row'>

                <div className='ql-modal-gradeview'>
                  Grade: {grade.value}% ({grade.points} out of {grade.outOf})<br />
                  Participation: {grade.participation}% ({grade.joined ? "joined" : "did not join" }) <br />
                  Questions answered total: {grade.numAnsweredTotal} (out of {grade.numQuestionsTotal}) <br />
                  Questions worth points answered: {grade.numAnswered} (out of {grade.numQuestions})  <br />
                  Questions: <br />
                  {
                    grade.marks.map((mark) => {
                      questionCount +=1
                      const autoText = mark.automatic ? "(auto-graded)": "(manually graded)"
                      const question = _(this.props.questions).findWhere({ _id:mark.questionId})
                      const onClick = () => this.toggleQuestionDisplayModal(question)
                      return ( <div key={mark.questionId}>
                         <a onClick={onClick}>
                           Q{questionCount}
                         </a>
                          {mark.points} out of {mark.outOf} on attempt {mark.attempt} {autoText}
                       </div>)
                    })
                  }

                <div className='btn-group btn-group-justified' role='group' aria-label='...'>
                  <a className='btn btn-default' onClick={this.props.done}>Close</a>
                </div>
              </div>

              </div>
             </div>
            </div>
            { this.state.QuestionDisplayModal
              ? <QuestionDisplayModal
                  question={this.state.questionToView}
                  done={this.toggleQuestionDisplayModal} />
              : '' }
        </div>
      : 'Loading')
  } //  end render

} // end profileViewModal

// meteor reactive data container
export const GradeViewModal = createContainer((props) => {
  const courseId = props.grade.courseId
  const sessionId = props.grade.sessionId
  const grade = props.grade
  const handle = Meteor.subscribe('users.myStudents', {cId: props.courseId}) &&
                 Meteor.subscribe('questions.inSession', sessionId) &&
                 Meteor.subscribe('sessions')

  const student = Meteor.users.findOne({ _id:grade.userId })
  const session = Sessions.findOne({ _id:sessionId })
  const questions = Questions.find({ _id: { $in: session.questions || [] } }).fetch()

  return {
    loading: !handle.ready(),
    grade: grade,
    student: student,
    questions: questions
  }
}, _GradeViewModal)

GradeViewModal.propTypes = {
  done: PropTypes.func,
  grade: PropTypes.object
}
