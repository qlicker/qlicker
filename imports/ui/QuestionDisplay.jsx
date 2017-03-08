/* global MathJax */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionDisplay.jsx: Component for displaying question in session

import React, { Component, PropTypes } from 'react'
import { $ } from 'jquery'
import { WysiwygHelper } from '../wysiwyg-helpers'
import { QUESTION_TYPE } from '../configs'

export class QuestionDisplay extends Component {

    constructor (p) {
        super(p)

<<<<<<< HEAD
        this.readonly = false
        if (this.props.readonly) this.readonly = this.props.readonly
=======
    this.readonly = false
    if (this.props.readonly) this.readonly = this.props.readonly

    this.submitAnswer = this.submitAnswer.bind(this)
  }
>>>>>>> master

        this.isQuiz = false
        if (this.props.isQuiz) this.isQuiz = this.props.isQuiz
    }

    /* 
    TODO
    - props for session mode, results
    - question types
    - next/submit button for quiz mode (props onclick to change session state)

<<<<<<< HEAD
    */
=======
  submitAnswer (answer) {
    const l = this.props.question.sessionOptions.attempts.length
    const attempt = this.props.question.sessionOptions.attempts[l - 1]
    const answerObject = {
      studentUserId: Meteor.userId(),
      answer: answer,
      attempt: attempt.number,
      questionId: this.props.question._id
    }
    console.log(answerObject)
    Meteor.call('answer.addQuestionAnswer', answerObject, (err, answerId) => {
      if (err) {
        alertify.error('Error: ' + err.error)
      } else {
        alertify.success('Answer Submitted')
        // success. do stuff here if needed
      }
    })
  }

  render () {
    const q = this.props.question
    return (<div className={'ql-question-display ' + (this.readonly ? '' : 'interactive')}>
>>>>>>> master

    componentDidMount () {
        this.componentDidUpdate()
    }

<<<<<<< HEAD
    componentDidUpdate () {
        MathJax.Hub.Queue(['Typeset', MathJax.Hub])
    }

// fix correct colour stuff for states
    wysiwygContent (answer, content, correct) {
        let classContent = correct ? 'ql-wysiwyg-content correct-color' : 'ql-wysiwyg-content incorrect-color'
        return (
            <div className={classContent}
            key={'answer_' + answer} >
                { WysiwygHelper.htmlDiv(content) }
            </div>)
    }

    commonContent (typeStr, answer, content, correct) {
        return (
            <div className={'ql-' + typeStr + '-content'} key={'answer_' + answer}>
                <span className={correct ? 'correct-color' : 'incorrect-color'}>{content}</span>
            </div>
        )
    }

    renderMultipleChoice (q) {
        return (
            q.answers.map((a) => {
            let content

            if (a.wysiwyg) {
                content = this.wysiwygContent(a.answer, a.content, a.correct)
            } else {
                content = this.commonContent('mc', a.answer, a.content, a.correct)
=======
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
>>>>>>> master
            }

            return (
                <div className='ql-answer-content-container'>
                    <div className='ql-checkbox'>{a.answer}.</div>
                    {content}
                </div> )
            })
        )
    }

    renderTrueFalse (q) {
        // const q = this.props.question
        return (
            q.answers.map((a) => {
            let content

            if (a.wysiwyg) {
                content = this.wysiwygContent(a.answer, a.content, a.correct)
            } else {
                content = this.commonContent('tf', a.answer, a.content, a.correct)
            }

            return (
                <div className='ql-answer-content-container'>
                    {content}
                </div> )
            })
        )
    }

// Refine this
    renderShortAnswer (q) {
        return (
            <div className='ql-answer-content-container'>
                <div className='ql-short-answer'> 
                    <input type="text"/>
                </div>
            </div> 
        )
    }

    renderMultiSelect (q) {
        return (
            q.answers.map((a) => {
            let content

            if (a.wysiwyg) {
                content = this.wysiwygContent(a.answer, a.content, a.correct)
            } else {
                content = this.commonContent('ms', a.answer, a.content, a.correct)
            }

            return (
                <div className='ql-answer-content-container'>
                    <div className='ql-checkbox'>CHECKBOX HERE</div>
                    {content}
                </div> )
            })
        )
    }

    render () {
        const q = this.props.question
        const type = q.type
        let content, buttons

        switch (type) {
            case QUESTION_TYPE.MC:
                content = this.renderMultipleChoice(q)
                break;
            case QUESTION_TYPE.TF: 
                content = this.renderTrueFalse(q)
                break;
            case QUESTION_TYPE.SA:
                content = this.renderShortAnswer(q)
                // add onclick for reset
                buttons = ( <div className='sa-buttons'>
                    <button className='btn btn-default'>Submit</button>
                    <button className='btn btn-default'>Reset</button> </div>)
                break;
            case QUESTION_TYPE.MS:
                content = this.renderMultiSelect(q)
                break;
        }

        return (
        <div className={'ql-question-display ' + (this.readonly ? '' : 'interactive')}>

            <div className='ql-question-content'>
                {WysiwygHelper.htmlDiv(q.content)}
            </div>

            <div className='ql-answers'>
                {content}
            </div>

            {buttons}
        </div>
        // add next (and prev?) button for quiz mode
        )
    } //end render
}

QuestionDisplay.propTypes = {
    question: PropTypes.object.isRequired,
    isQuiz: PropTypes.bool.isRequired,
    readonly: PropTypes.bool,
    answerSubmitted: PropTypes.func
}
