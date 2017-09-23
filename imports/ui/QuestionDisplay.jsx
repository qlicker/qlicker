/* global MathJax */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionDisplay.jsx: Component for displaying question in session

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { Responses } from '../api/responses'
import { Questions } from '../api/questions'
import { Sessions } from '../api/sessions'
//import dl from 'datalib' ///not used anymore
import { _ } from 'underscore'
import { $ } from 'jquery'
import { WysiwygHelper } from '../wysiwyg-helpers'
import { QUESTION_TYPE } from '../configs'

/**
 * React Component (meteor reactive) to display Question object and send question reponses.
 * @prop {Question} question - question object
 * @prop {Boolean} [readonly] - turn off all interactivity
 * @prop {Boolean} [noStats] - turn off response stats fetching
 * @prop {Boolean} [prof] - pass true if component used by professor account
 */
export class _QuestionDisplay extends Component {

  /**
   * setup Question display inital state.
   */
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

  /**
   * reset the state of component and prep for different Question
   */
  resetState () {
   // const l = this.props.question.sessionOptions.attempts.length
   // const attempt = this.props.question.sessionOptions.attempts[l - 1]
   const q1=this.props.question;
   const attempt = q1.sessionOptions
      ? q1.sessionOptions.attempts[q1.sessionOptions.attempts.length - 1]
      : 0

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

  /**
   * helper to determine in responses should be allowed
   * @returns {Boolean} status of whether component should allow reponse submission
   */
  disallowResponses () {
    const q = this.props.question
    const disallowResponses = q.sessionOptions && q.sessionOptions.attempts.length && q.sessionOptions.attempts[q.sessionOptions.attempts.length - 1].closed
    //const disallowResponses = q.sessionOptions && q.sessionOptions.attempts[q.sessionOptions.attempts.length - 1].closed
    return disallowResponses
  }

  /**
   * set answer in state for short answer questions
   * @param {Event} e - form event object
   */
  setShortAnswer (e) {
    this.setState({
      btnDisabled: false,
      submittedAnswer: e.target.value
    })
  }

  /**
   * set answer in state for option based questions
   * @param {String} answer - the answer key
   */
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

  /**
   * send response in state to server. Calls {@link module:responses~"responses.add" responses.add}
   */
  submitResponse () {

    if (this.disallowResponses() || this.readonly || !this.state.submittedAnswer) return
    // Can't choose responses after submission
    const answer = this.state.submittedAnswer
    this.readonly = true

    this.setState({
      btnDisabled: true,
      isSubmitted: true
    })

    const l = this.props.question.sessionOptions.attempts.length
    const attempt = this.props.question.sessionOptions.attempts[l - 1]

    const answerObject = {
      studentUserId: Meteor.userId(),
      answer: answer,
      attempt: attempt.number,
      questionId: this.props.question._id
    }

    Meteor.call('responses.add', answerObject, (err, answerId) => {
      if (err) return alertify.error('Error: ' + err.error)
      alertify.success('Answer Submitted')
    })
  }

  /**
   * calculate percentages for specific answer key
   * @param {String} answer
   */
  calculateStats (answer) {
    const stats = this.props.distribution
    let answerStat = 0
    stats.forEach((a) => {
      if (a) {
        if (a.answer === answer && a.counts) {
          answerStat = a.counts[0].pct
        }
      }
    })

    return answerStat
  }

  /**
   * generate dom elements for a wysiwyg answer option
   * @param {String} answer - answer key
   * @param {String} content - HTML content
   * @param {String} correct - whether of not this option is correct
   */
  wysiwygContent (answer, content, correct) {
    let classContent = 'ql-wysiwyg-content'

    if (!this.props.noStats && this.props.question.sessionOptions && this.props.question.sessionOptions.correct) {
      classContent = correct ? 'ql-wysiwyg-content correct-color' : 'ql-wysiwyg-content incorrect-color'
    }
    return (
      <div className={classContent} key={'answer_' + answer} >
        { WysiwygHelper.htmlDiv(content) }
      </div>)
  }

  /**
   * generate dom elements for plain text answer option
   * @param {String} typeStr - 2 char string representing question type
   * @param {String} answer - answer key
   * @param {String} content - HTML content
   * @param {String} correct - whether of not this option is correct
   */
  commonContent (typeStr, answer, content, correct) {
    let classContent = ''
    if (!this.props.noStats && this.props.question.sessionOptions && this.props.question.sessionOptions.correct) {
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

        let showStats = !this.props.noStats && this.props.question.sessionOptions && this.props.question.sessionOptions.stats
        if(this.props.showStatsOverride) showStats = true
        if (showStats) {
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
        const statsStr = '('+stats+'%)'
        const sess = this.props.question.sessionOptions
        const shouldShow = this.props.forReview || this.props.prof || (sess && sess.correct)

        return (
          <div key={'question_' + a.answer}
            onClick={() => this.setAnswer(a.answer)}
            className={'ql-answer-content-container ' +
              (this.state.submittedAnswer === a.answer || this.state.submittedAnswer.indexOf(a.answer) > -1
              ? 'q-submitted' : '')} >
            <div className={statClass} style={widthStyle}>&nbsp;</div>
            <div className='answer-container'>
              { classSuffixStr === 'mc' || classSuffixStr === 'ms' ?
                 <span className='ql-mc'>{a.answer}.</span>
                 : '' }
              {content} {(shouldShow && a.correct) ? '✓' : ''} {showStats ? statsStr: ''}
            </div>
          </div>)
      })
    )
  }

  renderShortAnswer (q) {
    if (this.props.forReview) return <h4 style={{'alignSelf': 'left'}}>{q.options[0].plainText}</h4>
    let showAns = !this.props.prof && (q.sessionOptions && q.sessionOptions.correct) && q.options[0].plainText
    return (
      <div className='ql-short-answer'>
        { showAns ? <h4>Correct Answer: {WysiwygHelper.htmlDiv(q.options[0].content)}</h4> : ''}
        <textarea
          disabled={this.readonly}
          placeholder='Type your answer here'
          className='form-control'
          rows='3'
          onChange={this.setShortAnswer}
          value={this.props.prof ? q.options[0].plainText : this.state.submittedAnswer} />
      </div>
    )
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    if (!this.props.noStats && this.props.question.sessionOptions && this.props.question.sessionOptions.hidden) return <div className='ql-subs-loading'>Waiting for a Question...</div>

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
  let formattedData = []
  let total
  let responses

  const question = props.question
  if (!props.noStats && question.type !== QUESTION_TYPE.SA && question.sessionOptions) {
    //Get the number of last attempt
    const attemptNumber = question.sessionOptions.attempts.length
    //Get the responses for that attempt:
    responses = Responses.find({ questionId: question._id, attempt: attemptNumber }).fetch()
    //Get the valid options for the question (e.g A, B, C)
    const validOptions = _(question.options).pluck('answer')
    //Get the total number of responses:
    total = responses.length
    let answerDistribution = {}

    //pull out all the answers from the responses, this gives an array of arrays of answers
    //e.g. [[A,B], [B], [B,C]], then flatten it
    allAnswers = _(_(responses).pluck('answer')).flatten()
    //then we count each occurrence of answer in the array
    //we add a new key to answerDistribution if it that answer doesn't exist yet, or increment otherwise
    allAnswers.forEach( (a) => {
      if(answerDistribution[a]) answerDistribution[a] += 1
      else answerDistribution[a] = 1
    })

    validOptions.forEach( (o) => {
      if(!answerDistribution[o]) answerDistribution[o] = 0
      pct = Math.round(100. * (total !==0 ? answerDistribution[o]/total : 0))
      //counts does not need to be an array, but leave the flexibility to be able to hold
      //the values for more than one attempt
      formattedData.push({ answer:o, counts:[ {attempt:attemptNumber, count:answerDistribution[o], pct:pct} ] })
    })

  }

  return {
    question: question,
    readonly: props.readonly,
    totalAnswered: total,
    distribution: formattedData,
    responses: responses,
    loading: !handle.ready()
  }
}, _QuestionDisplay)

QuestionDisplay.propTypes = {
  question: PropTypes.object.isRequired,
  readonly: PropTypes.bool,
  noStats: PropTypes.bool, //seems confusing...
  showStatsOverride: PropTypes.bool, //used for mobile session running
  prof: PropTypes.bool,
  forReview: PropTypes.bool
}
