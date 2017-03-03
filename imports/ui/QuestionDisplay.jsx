/* global MathJax */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionDisplay.jsx: Component for displaying question in session

import React, { Component, PropTypes } from 'react'
import { $ } from 'jquery'
import { WysiwygHelper } from '../wysiwyg-helpers'

export class QuestionDisplay extends Component {

  constructor (p) {
    super(p)

    this.submitAnswer = this.submitAnswer.bind(this)

    this.readonly = false
    if (this.props.readonly) this.readonly = this.props.readonly
  }

  submitAnswer (answer) {
    const answerObject = {
      studentUserId: Meteor.userId(),
      answer: answer,
      attempt: this.props.attempt.number,
      questionId: this.props.question._id
    }
    Meteor.call('answer.addQuestionAnswer', answerObject, (err, answerId) => {
      if (err) {
        alertify.error('Error: ' + err.error)
      } else {
        alertify.success('Answer Submitted')
        // success. do stuff here if needed
      }
    })
  }

  componentDidMount () {
    this.componentDidUpdate()
  }

  componentDidUpdate () {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])
  }

  render () {
    const q = this.props.question
    return (<div className={'ql-question-display ' + (this.readonly ? '' : 'interactive')}>

      <div className='ql-question-content'>
        {WysiwygHelper.htmlDiv(q.content)}
      </div>

      <div className='ql-answers'>
        {
          q.options.map((a) => {
            let content

            if (a.wysiwyg) {
              content = (<div onClick={() => this.submitAnswer(a.answer)} className='ql-wysiwyg-content' key={'answer_' + a.answer}>
                { WysiwygHelper.htmlDiv(a.content) }
              </div>)
            } else {
              content = (<div onClick={() => this.submitAnswer(a.answer)} className='ql-tf-content' key={'answer_' + a.answer}>
                <span className={a.answer === 'TRUE' ? 'correct-color' : 'incorrect-color'}>{a.answer}</span>
              </div>)
            }

            return <div className='ql-answer-content-container'>
              <div className='ql-checkbox'>{a.answer}.</div>
              {content}
            </div>
          })
        }
      </div>

    </div>)
  } //  end render

}

QuestionDisplay.propTypes = {
  question: PropTypes.object.isRequired,
  readonly: PropTypes.bool,
  answerSubmitted: PropTypes.func
}

