/* global MathJax */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionDisplay.jsx: Component for displaying question in session

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { Responses } from '../api/responses'
import { _ } from 'underscore'
import { WysiwygHelper } from '../wysiwyg-helpers'
import { QUESTION_TYPE } from '../configs'
import { Editor } from './Editor'

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
    const attemptNumber = q.sessionOptions
      ? q.sessionOptions.attempts[q.sessionOptions.attempts.length - 1].number
      : 0

    this.state = {
      btnDisabled: true,
      submittedAnswer: '',
      submittedAnswerWysiwyg: '',
      questionId: this.props.question._id,
      isSubmitted: false,
      attemptNumber: attemptNumber,
      wasVisited: false
    }

    this.readonly = false
    if (this.props.readonly) this.readonly = this.props.readonly

    this.submitResponse = this.submitResponse.bind(this)
    this.disallowResponses = this.disallowResponses.bind(this)
    this.setAnswer = this.setAnswer.bind(this)
    //this.setShortAnswer = this.setShortAnswer.bind(this)
    this.setShortAnswerWysiwyg = this.setShortAnswerWysiwyg.bind(this)
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
   * Decide whether to reset the state (e.g. if the question or attempt number changed)
   * Since this is reactive to the response collection, it gets called anytime someone (else)
   * submits a response to a question.
   */
  resetState () {
    // Don't reset if still loading
    if(this.props.loading){
      return
    }

    const q1 = this.props.question
    const attemptNumber = q1.sessionOptions
      ? q1.sessionOptions.attempts[q1.sessionOptions.attempts.length - 1].number
      : 0

    const myResponse = this.props.myresponse

    if (this.state.questionId !== this.props.question._id || //the question changed
      (this.state.questionId === this.props.question._id && this.state.attemptNumber !== attemptNumber) || //the attempt changed
      (this.state.questionId === this.props.question._id && this.state.attemptNumber === attemptNumber && myResponse)) { //there is already a response
      if (myResponse && (!this.state.wasVisited)) {
        // Fill the state with the exsiting response
        const submittedAnswerWysiwyg = (q1.type === QUESTION_TYPE.SA) ? myResponse.answerWysiwyg : ''
        this.setState({
          btnDisabled: true,
          submittedAnswer: myResponse.answer,
          submittedAnswerWysiwyg: submittedAnswerWysiwyg,
          questionId: this.props.question._id,
          isSubmitted: true,
          attemptNumber: attemptNumber,
          wasVisited: true
        })
        this.readonly = true
      } else if (!myResponse) {
        // reset the state to for an empty response
        this.setState({
          btnDisabled: true,
          submittedAnswer: '',
          submittedAnswerWysiwyg: '',
          questionId: this.props.question._id,
          isSubmitted: false,
          attemptNumber: attemptNumber,
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
    // const disallowResponses = q.sessionOptions && q.sessionOptions.attempts[q.sessionOptions.attempts.length - 1].closed
    return disallowResponses
  }

  /**
   * set answer in state for short answer questions
   * @param {Event} e - form event object

  setShortAnswer (e) {
    if (this.disallowResponses() || this.readonly) return
    this.setState({
      btnDisabled: false,
      submittedAnswer: e.target.value
    })
  }*/

  /**
   * set answer in state for short answer questions
   *
   */
  setShortAnswerWysiwyg (content, plainText) {
    if (this.disallowResponses() || this.readonly) return
    this.setState({
      btnDisabled: false,
      submittedAnswer: plainText,
      submittedAnswerWysiwyg: content
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
    const answerWysiwyg = this.state.submittedAnswerWysiwyg
    this.readonly = true

    this.setState({
      btnDisabled: true,
      isSubmitted: true
    })

    const l = this.props.question.sessionOptions.attempts.length
    const attemptNumber = this.props.question.sessionOptions.attempts[l - 1].number

    const answerObject = {
      studentUserId: Meteor.userId(),
      answer: answer,
      answerWysiwyg: answerWysiwyg,
      attempt: attemptNumber,
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
        if (this.props.showStatsOverride) showStats = true
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
        const statsStr = '(' + stats + '%)'
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
              { classSuffixStr === 'mc' || classSuffixStr === 'ms'
                ? <span className='ql-mc'>{a.answer}.</span>
                 : '' }
              {content} {(shouldShow && a.correct) ? '✓' : ''} {showStats ? statsStr : ''}
            </div>
          </div>)
      })
    )
  }

  renderShortAnswer (q) {
    if ((this.props.forReview || this.props.prof)) {
      // return <h4 style={{'alignSelf': 'left'}}>{q.options[0].plainText}</h4>
      return (
        <div>
          {q.options[0].content
            ? <h4 style={{'alignSelf': 'left'}}>{WysiwygHelper.htmlDiv(q.options[0].content)}</h4>
          : ''
        }</div>
      )
    }

    let showAns = !this.props.prof && (q.sessionOptions && q.sessionOptions.correct) && q.options[0].plainText

    return (
      <div className='ql-answer-content-container ql-short-answer' >
        { showAns ? <h4>Correct Answer: {WysiwygHelper.htmlDiv(q.options[0].content)}</h4> : ''}

        { this.readonly ? WysiwygHelper.htmlDiv(this.state.submittedAnswerWysiwyg)
        : <div className={'small-editor-wrapper col-md-12'}>
          <Editor
            change={this.setShortAnswerWysiwyg}
            placeholder='Type your answer here'
            val={this.state.submittedAnswerWysiwyg}
            className='answer-editor'
            />
        </div>
        }
      </div>
    )
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    if (!this.props.noStats && this.props.question.sessionOptions && this.props.question.sessionOptions.hidden) return <div className='ql-subs-loading'>Waiting for a Question...</div>

    const q = this.props.question
    const type = q.type
    let content

    const showToolbar = (type === QUESTION_TYPE.SA) && (!this.state.isSubmitted) && (!this.props.prof) && (!this.props.readonly)

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

        { showToolbar ? <div id='ckeditor-toolbar' /> : '' }
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
  // Get the number of last attempt
  const attemptNumber = (question && question.sessionOptions && question.sessionOptions.attempts) ? question.sessionOptions.attempts.length : 0
  // Get the responses for that attempt:
  responses = Responses.find({ questionId: question._id, attempt: attemptNumber }).fetch()
  const myresponse = props.response
                    ? props.response
                    :_(responses).findWhere({ studentUserId: Meteor.userId(), attempt: attemptNumber })
  if (!props.noStats && question.type !== QUESTION_TYPE.SA && question.sessionOptions) {
    // Get the valid options for the question (e.g A, B, C)
    const validOptions = _(question.options).pluck('answer')
    // Get the total number of responses:
    total = responses.length
    let answerDistribution = {}

    // pull out all the answers from the responses, this gives an array of arrays of answers
    // e.g. [[A,B], [B], [B,C]], then flatten it
    let allAnswers = _(_(responses).pluck('answer')).flatten()
    // then we count each occurrence of answer in the array
    // we add a new key to answerDistribution if it that answer doesn't exist yet, or increment otherwise
    allAnswers.forEach((a) => {
      if (answerDistribution[a]) answerDistribution[a] += 1
      else answerDistribution[a] = 1
    })

    validOptions.forEach((o) => {
      if (!answerDistribution[o]) answerDistribution[o] = 0
      let pct = Math.round(100.0 * (total !== 0 ? answerDistribution[o] / total : 0))
      // counts does not need to be an array, but leave the flexibility to be able to hold
      // the values for more than one attempt
      formattedData.push({ answer: o, counts: [ {attempt: attemptNumber, count: answerDistribution[o], pct: pct} ] })
    })
  }

  return {
    question: question,
    readonly: props.readonly,
    totalAnswered: total,
    distribution: formattedData,
    myresponse: myresponse,
    loading: !handle.ready()
  }
}, _QuestionDisplay)

QuestionDisplay.propTypes = {
  question: PropTypes.object.isRequired,
  response: PropTypes.object,
  readonly: PropTypes.bool,
  noStats: PropTypes.bool, // seems confusing...
  showStatsOverride: PropTypes.bool, // used for mobile session running
  prof: PropTypes.bool,
  forReview: PropTypes.bool
}
