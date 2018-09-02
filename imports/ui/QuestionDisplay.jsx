/* global MathJax */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionDisplay.jsx: Component for displaying question in session

import React, { Component, PropTypes } from 'react'

import { WysiwygHelper } from '../wysiwyg-helpers'
import { QUESTION_TYPE } from '../configs'
import { Editor } from './Editor'

/**
 * React Component (meteor reactive) to display Question object and send question reponses.
 * @prop {Question} question - question object
 * @prop {Boolean} [readonly] - turn off all interactivity
 * @prop {Boolean} [prof] - pass true if component used by professor account
 */

export class QuestionDisplay extends Component {

  /**
   * setup Question display inital state.
   */
  constructor (p) {
    super(p)
    const q = this.props.question
    const r = this.props.response

    this.state = {
      btnDisabled: true,
      submittedAnswer: r ? r.answer : '',
      submittedAnswerWysiwyg: r ? r.answerWysiwyg : '',
      questionId: q._id,
      isSubmitted: !!r,
      showCorrect: false, // used for student review, to reveal correct answer
      showResponse: false // used for student review, to show their attempt
    }

    this.readonly = !!r
    if (this.props.readonly) this.readonly = this.props.readonly

    this.submitResponse = this.submitResponse.bind(this)
    this.disallowResponses = this.disallowResponses.bind(this)
    this.toggleShowCorrect = this.toggleShowCorrect.bind(this)
    this.toggleShowResponse = this.toggleShowResponse.bind(this)

    this.setAnswer = this.setAnswer.bind(this)
    this.setShortAnswerWysiwyg = this.setShortAnswerWysiwyg.bind(this)
  }

  componentWillMount () {
    const q = this.props.question
    const r = this.props.response
    this.state = {
      btnDisabled: true,
      submittedAnswer: r ? r.answer : '',
      submittedAnswerWysiwyg: r ? r.answerWysiwyg : '',
      questionId: q._id,
      isSubmitted: !!r,
      showCorrect: false,
      showResponse: false
    }
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])
  }

  componentDidMount () {
    this.componentDidUpdate()
  }

  componentDidUpdate () {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])
  }

  componentWillReceiveProps (nextProps) {
    const isNewQuestion = (this.props.question._id !== nextProps.question._id) ||
                          (this.state.questionId !== nextProps.question._id)

    // Was a new response passed as prop (TODO: check that this doesn't break in session stuff...)
    const isNewResponse = (this.props.response && nextProps.response && (this.props.response._id !== nextProps.response._id)) ||
                          (this.props.response && !nextProps.response) ||
                          (!this.props.response && nextProps.response)

    const isNewAttempt = (this.props.attemptNumber !== nextProps.attemptNumber)

    const showCorrect = false
    const showResponse = false

    if (isNewQuestion || isNewResponse || isNewAttempt) {
      if (nextProps.response) {
        const response = nextProps.response
        const submittedAnswerWysiwyg = (nextProps.question.type === QUESTION_TYPE.SA) ? response.answerWysiwyg : ''
        this.setState({
          btnDisabled: true,
          submittedAnswer: response.answer,
          submittedAnswerWysiwyg: submittedAnswerWysiwyg,
          questionId: nextProps.question._id,
          isSubmitted: true,
          showCorrect: showCorrect,
          showResponse: showResponse
        })
        this.readonly = true
      } else {
        this.setState({
          btnDisabled: true,
          submittedAnswer: '',
          submittedAnswerWysiwyg: '',
          questionId: nextProps.question._id,
          isSubmitted: false,
          showCorrect: showCorrect,
          showResponse: showResponse
        })

        this.readonly = false
        if (nextProps.readonly) this.readonly = nextProps.readonly
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

  toggleShowCorrect () {
    this.setState({showCorrect: !this.state.showCorrect})
  }

  toggleShowResponse () {
    this.setState({showResponse: !this.state.showResponse})
  }

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
    // TODO: Check if attempt number is higher than allowed (needs an additional prop to know if it's in a quiz)
    // Can't choose responses after submission
    const answer = this.state.submittedAnswer
    const answerWysiwyg = this.state.submittedAnswerWysiwyg
    this.readonly = true

    this.setState({
      btnDisabled: true,
      isSubmitted: true
    })

    const responseObject = {
      studentUserId: Meteor.userId(),
      answer: answer,
      answerWysiwyg: answerWysiwyg,
      attempt: this.props.attemptNumber,
      questionId: this.props.question._id
    }
    if (this.props.onSubmit) {
      this.props.onSubmit()
    }

    Meteor.call('responses.add', responseObject, (err, answerId) => {
      if (err) return alertify.error('Error: ' + err.error)
      alertify.success('Answer Submitted')
    })
  }

  /**
   * calculate percentages for specific answer key
   * @param {String} answer
   */
  calculateStats (answer) {
    const stats = this.props.responseStats
    if (!stats) return 0
    let answerStat = 0
    stats.forEach((a) => {
      if (a) {
        if (a.answer === answer) {
          answerStat = a.pct
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

    if (!this.props.forReview && this.props.question.sessionOptions && this.props.question.sessionOptions.correct) {
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
    if (!this.props.forReview && this.props.question.sessionOptions && this.props.question.sessionOptions.correct) {
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

        let showStats = !this.props.forReview && this.props.responseStats && this.props.question.sessionOptions && this.props.question.sessionOptions.stats
        if (this.props.showStatsOverride) showStats = true
        if (showStats) {
          stats = this.calculateStats(a.answer)

          if (stats > 0) {
            statClass += ' show-stats'
            // don't show colours if it's for review
            if (!this.props.forReview && this.props.question.sessionOptions.correct && a.correct) {
              statClass += ' show-stats-correct'
            } else if (!this.props.forReview && this.props.question.sessionOptions.correct && !(a.correct)) {
              statClass += ' show-stats-incorrect'
            }
          }

          widthStyle = { width: stats + '%' }
        }
        const statsStr = '(' + stats + '%)'
        const sess = this.props.question.sessionOptions
        let shouldShowCorrect = this.props.forReview || this.props.prof || (sess && sess.correct)
        if (shouldShowCorrect && this.props.forReview && !this.props.prof && !this.state.showCorrect) {
          shouldShowCorrect = false
        }
        let shouldShowResponse = this.state.submittedAnswer === a.answer || this.state.submittedAnswer.indexOf(a.answer) > -1
        if (shouldShowResponse && this.props.forReview && !this.props.prof && !this.state.showResponse) {
          shouldShowResponse = false
        }
        return (
          <div key={'question_' + a.answer}
            onClick={() => this.setAnswer(a.answer)}
            className={'ql-answer-content-container ' + (shouldShowResponse ? 'q-submitted' : '')} >
            <div className={statClass} style={widthStyle}>&nbsp;</div>
            <div className='answer-container'>
              { classSuffixStr === 'mc' || classSuffixStr === 'ms'
                ? <span className='ql-mc'>{a.answer}.</span>
                 : '' }
              {content} {(shouldShowCorrect && a.correct) ? '✓' : ''} {showStats ? statsStr : ''}
            </div>
          </div>)
      })
    )
  }

  renderShortAnswer (q) {
    if ((this.props.forReview || this.props.prof)) {
      let shouldShowCorrect = !!q.options[0].content
      if (this.props.forReview && !this.props.prof && !this.state.showCorrect) {
        shouldShowCorrect = false
      }
      let shouldShowResponse = !!this.props.response
      if (shouldShowResponse && this.props.forReview && !this.props.prof && !this.state.showResponse) {
        shouldShowResponse = false
      }
      return (
        <div className='ql-short-answer' >
          {shouldShowResponse
            ? WysiwygHelper.htmlDiv(this.state.submittedAnswerWysiwyg)
            : ''
          }
          {shouldShowCorrect
            ? <h4 style={{'alignSelf': 'left'}}> Correct Answer: <br />{WysiwygHelper.htmlDiv(q.options[0].content)}</h4>
          : ''
          }
        </div>
      )
    }

    let showAns = !this.props.prof && (q.sessionOptions && q.sessionOptions.correct) && q.options[0].content

    return (
      <div className='ql-short-answer' >
        { this.readonly
          ? WysiwygHelper.htmlDiv(this.state.submittedAnswerWysiwyg)
          : <Editor
            change={this.setShortAnswerWysiwyg}
            placeholder='Type your answer here'
            val={this.state.submittedAnswerWysiwyg}
            toolbarDivId={this.props.question ? this.props.question._id + '_ckToolbar' : 'ckeditor-toolbar'}
            />
        }
        { showAns ? <h4>Correct Answer:<br /> {WysiwygHelper.htmlDiv(q.options[0].content)}</h4> : ''}
      </div>
    )
  }

  render () {
    if (this.props.loading || !this.props.question) return <div className='ql-subs-loading'>Loading</div>

    if (!this.props.forReview && this.props.question.sessionOptions && this.props.question.sessionOptions.hidden) return <div className='ql-subs-loading'>Waiting for a Question...</div>

    const q = this.props.question
    const type = q.type
    let content

    const showToolbar = (type === QUESTION_TYPE.SA) && (!this.state.isSubmitted) && (!this.props.prof) && (!this.props.readonly)
    let msInfo = ''
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
        if (!this.props.readonly && !this.state.isSubmitted && !this.props.prof) msInfo = <div className='msInfo'>Select all that apply</div>
        break
    }

    return (

      <div className={'ql-question-display ' + (this.disallowResponses() || this.readonly ? '' : 'interactive')}>

        <div className='ql-question-content'>
          {WysiwygHelper.htmlDiv(q.content)}
        </div>

        { this.disallowResponses() ? <div className='ql-subs-loading'>Answering Disabled</div> : '' }

        { showToolbar ? <div id={this.props.question ? this.props.question._id + '_ckToolbar' : 'ckeditor-toolbar'} /> : '' }

        <div className='ql-answers'>
          {msInfo}
          {content}
        </div>

        { !this.props.readonly
          ? <div className='bottom-buttons'>
            <button className='btn btn-primary submit-button' onClick={() => this.submitResponse()} disabled={this.state.btnDisabled}>
              {this.state.isSubmitted ? 'Submitted' : 'Submit'}
            </button>
          </div>
          : ''
        }
        { this.props.forReview && this.props.readonly && !this.props.prof
          ? <div className='btn-group btn-group-justified'>
            <div className='btn btn-primary' onClick={this.toggleShowCorrect}>
              {this.state.showCorrect ? 'Hide correct' : 'Show correct'}
            </div>
            { this.props.response
                  ? <div className='btn btn-primary' onClick={this.toggleShowResponse} >
                    {this.state.showResponse ? 'Hide response' : 'Show response'}
                  </div>
                  : ''
                }
          </div>
          : ''
        }

        {(this.state.showCorrect || (q.sessionOptions && q.sessionOptions.correct)) && q.solution  ? <div className='ql-question-solution'>Solution:<div className='ql-question-solution-content'>{WysiwygHelper.htmlDiv(q.solution)}</div></div> : ''}

      </div>
    )
  } // end render
}

QuestionDisplay.propTypes = {
  question: PropTypes.object,
  response: PropTypes.object, // response to display with the question
  attemptNumber: PropTypes.number,
  responseStats: PropTypes.array, // distribution of answers for displaying stats
  readonly: PropTypes.bool,
  showStatsOverride: PropTypes.bool, // used for mobile session running
  prof: PropTypes.bool, // if viewed by an instructor, overrides showing correct answer
  forReview: PropTypes.bool,
  onSubmit: PropTypes.func // function to run when clicking submit
}
