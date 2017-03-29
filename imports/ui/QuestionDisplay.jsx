/* global MathJax */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionDisplay.jsx: Component for displaying question in session

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { Responses } from '../api/responses'
import { Questions } from '../api/questions'
import dl from 'datalib'
import { _ } from 'underscore'
import { $ } from 'jquery'
import { WysiwygHelper } from '../wysiwyg-helpers'
import { QUESTION_TYPE } from '../configs'


export class _QuestionDisplay extends Component {

  constructor (p) {
    super(p)

    const q = this.props.question
    const attempt = q.sessionOptions
      ? q.sessionOptions.attempts[q.sessionOptions.attempts.length - 1]
      : 0

    this.state = {
      btnDisabled: true,
      submittedAnswer: '',
      questionId: this.props.question._id,
      isSubmitted: false,
      attempt: attempt,
      wasVisited: false
    }

    this.readonly = false
    if (this.props.readonly) this.readonly = this.props.readonly

    this.submitResponse = this.submitResponse.bind(this)
    this.disallowResponses = this.disallowResponses.bind(this)
    this.setAnswer = this.setAnswer.bind(this)
    this.setShortAnswer = this.setShortAnswer.bind(this)
    this.resetState = this.resetState.bind(this)
  }

  componentDidMount () {
    this.componentDidUpdate()
  }

  componentDidUpdate () {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])

    this.resetState()
  }

  resetState () {
    const l = this.props.question.sessionOptions.attempts.length
    const attempt = this.props.question.sessionOptions.attempts[l - 1]

    const myResponses = _(this.props.responses).where({ studentUserId: Meteor.userId() })

    if (this.state.questionId !== this.props.question._id ||
      (this.state.questionId === this.props.question._id && this.state.attempt !== attempt) ||
      (this.state.questionId === this.props.question._id && this.state.attempt === attempt && myResponses.length > 0)) {
      if (myResponses.length > 0 && (!this.state.wasVisited)) {
        this.setState({
          btnDisabled: true,
          submittedAnswer: myResponses[0].answer,
          questionId: this.props.question._id,
          isSubmitted: true,
          attempt: attempt,
          wasVisited: true
        })

        this.readonly = true
      } else if (myResponses.length <= 0) {
        this.setState({
          btnDisabled: true,
          submittedAnswer: '',
          questionId: this.props.question._id,
          isSubmitted: false,
          attempt: attempt,
          wasVisited: false
        })

        this.readonly = false
        if (this.props.readonly) this.readonly = this.props.readonly
      }
    }
  }

  disallowResponses () {
    const q = this.props.question
    const disallowResponses = q.sessionOptions && q.sessionOptions.attempts[q.sessionOptions.attempts.length - 1].closed
    return disallowResponses
  }

  setShortAnswer (e) {
    this.setState({
      btnDisabled: false,
      submittedAnswer: e.target.value
    })
  }

  setAnswer (answer) {
    if (this.disallowResponses() || this.readonly) return

    let answerToSubmit = answer

    if (this.props.question.type === QUESTION_TYPE.MS) {
      if (!this.state.submittedAnswer) answerToSubmit = [answer]
      else {
        const i = this.state.submittedAnswer.indexOf(answer)
        if (i > -1) {
          const arrayWithoutAnswer = this.state.submittedAnswer
          arrayWithoutAnswer.splice(i, 1)
          answerToSubmit = arrayWithoutAnswer
        } else answerToSubmit = this.state.submittedAnswer.concat([answer])
      }
    }

    this.setState({
      btnDisabled: false,
      submittedAnswer: answerToSubmit
    })
  }

  submitResponse () {
    if (this.disallowResponses() || this.readonly || !this.state.submittedAnswer) return
    // Can't choose responses after submission
    const answer = this.state.submittedAnswer
    this.readonly = true

    this.setState({
      btnDisabled: true,
      isSubmitted: true
    })

    const myResponses = _(this.props.responses).where({ studentUserId: Meteor.userId() })
    const oldAnswer = myResponses.length > 0 ? myResponses[0] : null

    const l = this.props.question.sessionOptions.attempts.length
    const attempt = this.props.question.sessionOptions.attempts[l - 1]

    const answerObject = {
      studentUserId: Meteor.userId(),
      answer: answer,
      attempt: attempt.number,
      questionId: this.props.question._id
    }
    console.log(answerObject)

    /* // no longer needed cause can only submit once with button
    // remove or add options to MS response
    if (this.props.question.type === QUESTION_TYPE.MS) {
      if (oldAnswer && oldAnswer.answer.length > 0) {
        const index = oldAnswer.answer.indexOf(answer)
        if (index > -1) { // if old answer array has new answer
          oldAnswer.answer.splice(index, 1) // remove new answer
          answerObject.answer = oldAnswer.answer
        } else answerObject.answer = oldAnswer.answer.concat([answer]) // add new answer to old answer array
      } else answerObject.answer = [answer] // create new answer array
      answerObject.answer = _(answerObject.answer).uniq() // in theory, this is not needed
    }
    */

    Meteor.call('responses.add', answerObject, (err, answerId) => {
      if (err) return alertify.error('Error: ' + err.error)
      alertify.success('Answer Submitted')
    })
  }

  calculateStats (answer) {
    const stats = this.props.distribution
    const total = this.props.totalAnswered
    let answerStat = 0

    stats.forEach((a) => {
      if (a) {
        if (a.answer === answer && a.counts) {
          answerStat = Math.round(a.counts[0].count / total * 100, 2)
        }
      }
    })

    return answerStat
  }

  wysiwygContent (answer, content, correct) {
    let classContent = 'ql-wysiwyg-content'

    if (!this.props.noStats && this.props.question.sessionOptions.correct) {
      classContent = correct ? 'ql-wysiwyg-content correct-color' : 'ql-wysiwyg-content incorrect-color'
    }

    return (
      <div className={classContent} key={'answer_' + answer} >
        { WysiwygHelper.htmlDiv(content) }
      </div>)
  }

  commonContent (typeStr, answer, content, correct) {
    let classContent = ''
    if (!this.props.noStats && this.props.question.sessionOptions.correct) {
      classContent = correct ? 'correct-color' : 'incorrect-color'
    }
    return (
      <div className={'ql-' + typeStr + '-content'} key={'answer_' + answer}>
        <span className={classContent}>{content}</span>
      </div>
    )
  }

  renderOptionQuestion (classSuffixStr, q) {
    return (
      q.options.map((a) => {
        let content
        let stats = 0
        let statClass = 'stat-bar'
        let widthStyle = { width: '0%' }

        if (a.wysiwyg) content = this.wysiwygContent(a.answer, a.content, a.correct)
        else content = this.commonContent(classSuffixStr, a.answer, a.content, a.correct)

        if (!this.props.noStats && this.props.question.sessionOptions.stats) {
          stats = this.calculateStats(a.answer)

          if (stats > 0) {
            statClass += ' show-stats'

            if (this.props.question.sessionOptions.correct && a.correct) {
              statClass += ' show-stats-correct'
            } else if (this.props.question.sessionOptions.correct && !(a.correct)) {
              statClass += ' show-stats-incorrect'
            }
          }

          widthStyle = { width: stats + '%' }
        }

        return (
          <div key={'question_' + a.answer}
            onClick={() => this.setAnswer(a.answer)}
            className={'ql-answer-content-container ' +
              (this.state.submittedAnswer === a.answer || this.state.submittedAnswer.indexOf(a.answer) > -1
              ? 'q-submitted' : '')} >
            <div className={statClass} style={widthStyle}>&nbsp;</div>
            <div className='answer-container'>
              { classSuffixStr === 'ms' ? <input type='checkbox' className='ql-checkbox' /> : '' }
              { classSuffixStr === 'mc' || classSuffixStr === 'ms'
                ? <span className='ql-mc'>{a.answer}.</span> : '' }
              {content}
            </div>
          </div>)
      })
    )
  }

  // Refine this
  renderShortAnswer (q) {
    return (
      <div className='ql-short-answer'>
        <textarea
          disabled={this.readonly}
          placeholder='Type your answer here'
          className='form-control'
          rows='3'
          onChange={this.setShortAnswer}
          value={this.state.submittedAnswer} />
      </div>
    )
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    if (!this.props.noStats && this.props.question.sessionOptions.hidden) return <div className='ql-subs-loading'>Waiting for a Question...</div>

    const q = this.props.question
    const type = q.type
    let content

    switch (type) {
      case QUESTION_TYPE.MC:
        content = this.renderOptionQuestion('mc', q)
        break
      case QUESTION_TYPE.TF:
        content = this.renderOptionQuestion('tf', q)
        break
      case QUESTION_TYPE.SA:
        content = this.renderShortAnswer(q)
        break
      case QUESTION_TYPE.MS:
        content = this.renderOptionQuestion('ms', q)
        break
    }

    return (
      <div className={'ql-question-display ' + (this.disallowResponses() || this.readonly ? '' : 'interactive')}>

        <div className='ql-question-content'>
          {WysiwygHelper.htmlDiv(q.content)}
        </div>

        { this.disallowResponses() && (!this.props.noStats) ? <div className='ql-subs-loading'>Answering Disabled</div> : '' }

        <div className='ql-answers'>
          {content}
        </div>

        <div className='bottom-buttons'>
          { !this.props.readonly
            ? <button className='btn btn-primary submit-button' onClick={() => this.submitResponse()} disabled={this.state.btnDisabled}>
              {this.state.isSubmitted ? 'Submitted' : 'Submit'}
            </button>
          : ''}
        </div>

      </div>
    )
  } // end render
}

export const QuestionDisplay = createContainer((props) => {
  const handle = Meteor.subscribe('responses.forQuestion', props.question._id)
  const data = []
  let total
  let responses

  const question = props.question
  console.log(question)
  if (!props.noStats) {
    const l = question.sessionOptions.attempts.length

    responses = Responses.find({ questionId: question._id, attempt: l }).fetch()

    const validOptions = _(question.options).pluck('answer')
    total = responses.length

    let options = _(dl.groupby('answer').execute(responses)).sortBy('answer')

    options.map((a) => {
      a.counts = _(dl.groupby('attempt').count().execute(a.values)).sortBy('attempt')
      delete a.values
    })
    const keyedOptions = _(options).indexBy('answer')

    // split up multi-select responses
    const arrayKeys = _(options).chain().pluck('answer').filter((k) => k instanceof Array).value()
    arrayKeys.forEach((k) => {
      k.forEach((j) => {
        keyedOptions[j] = _({}).extend(keyedOptions[k])
        keyedOptions[j].answer = j
      })
    })

    validOptions.forEach((key) => {
      data.push(keyedOptions[key])
    })
  }

  return {
    question: question,
    readonly: props.readonly,
    totalAnswered: total,
    distribution: data,
    responses: responses,
    loading: !handle.ready()
  }
}, _QuestionDisplay)

QuestionDisplay.propTypes = {
  question: PropTypes.object.isRequired,
  readonly: PropTypes.bool,
  noStats: PropTypes.bool,
  prof: PropTypes.bool
}
