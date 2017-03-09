/* global MathJax */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionDisplay.jsx: Component for displaying question in session

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import { Answers } from '../api/answers'
import dl from 'datalib'
import { $ } from 'jquery'
import { WysiwygHelper } from '../wysiwyg-helpers'
import { QUESTION_TYPE } from '../configs'


export class _QuestionDisplay extends Component {

  constructor (p) {
    super(p)

    this.readonly = false
    if (this.props.readonly) this.readonly = this.props.readonly

    this.isQuiz = false
    if (this.props.isQuiz) this.isQuiz = this.props.isQuiz

    this.submitAnswer = this.submitAnswer.bind(this)
  }

  componentDidMount () {
    this.componentDidUpdate()
  }

  componentDidUpdate () {
    MathJax.Hub.Queue(['Typeset', MathJax.Hub])
  }

  // doesn't work for multiselect & works when readonly is true
  submitAnswer (answer) {
    const l = this.props.question.sessionOptions.attempts.length
    const attempt = this.props.question.sessionOptions.attempts[l - 1]
    const answerObject = {
      studentUserId: Meteor.userId(),
      answer: answer,
      attempt: attempt.number,
      questionId: this.props.question._id
    }
    Meteor.call('answer.addQuestionAnswer', answerObject, (err, answerId) => {
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

    if (this.props.question.sessionOptions.correct) {
      classContent = correct ? 'ql-wysiwyg-content correct-color' : 'ql-wysiwyg-content incorrect-color'
    }

    return (
      <div onClick={() => this.submitAnswer(answer)} className={classContent} key={'answer_' + answer} >
        { WysiwygHelper.htmlDiv(content) }
      </div>)
  }

  commonContent (typeStr, answer, content, correct) {
    let classContent = ''
    if (this.props.question.sessionOptions.correct) {
      classContent = correct ? 'correct-color' : 'incorrect-color'
    }
    return (
      <div onClick={() => this.submitAnswer(answer)} className={'ql-' + typeStr + '-content'} key={'answer_' + answer}>
        <span className={classContent}>{content}</span>
      </div>
    )
  }

  renderMultipleChoice (q) {
    return (
      q.options.map((a) => {
        let content
        let stats = 0
        let statClass = 'stat-bar'
        let widthStyle = { width: '0%' }

        if (a.wysiwyg) {
          content = this.wysiwygContent(a.answer, a.content, a.correct)
        } else {
          content = this.commonContent('mc', a.answer, a.content, a.correct)
        }

        if (this.props.question.sessionOptions.stats) {
          stats = this.calculateStats(a.answer)

          if (stats > 0){
            statClass += ' show-stats'

            if (this.props.question.sessionOptions.correct && a.correct) { 
              statClass += ' show-stats-correct'
            } else if (this.props.question.sessionOptions.correct && !(a.correct)) {
              statClass += ' show-stats-incorrect'
            }
          } 

          widthStyle = { width:  stats + '%'}
        }

        return (
          <div className='ql-answer-content-container'>
            <div className={statClass} style={widthStyle}>
              <div className='ql-mc'>{a.answer}.</div>
              {content}
            </div>
          </div>)
      })
    )
  }

  renderTrueFalse (q) {
    return (
      q.options.map((a) => {
        let content
        let stats = 0
        let statClass = 'stat-bar'
        let widthStyle = { width: '0%' }

        if (a.wysiwyg) {
          content = this.wysiwygContent(a.answer, a.content, a.correct)
        } else {
          content = this.commonContent('tf', a.answer, a.content, a.correct)
        }

        if (this.props.question.sessionOptions.stats) {
          stats = this.calculateStats(a.answer)

          if (stats > 0){
            statClass += ' show-stats'

            if (this.props.question.sessionOptions.correct && a.correct) { 
              statClass += ' show-stats-correct'
            } else if (this.props.question.sessionOptions.correct && !(a.correct)) {
              statClass += ' show-stats-incorrect'
            }
          } 

          widthStyle = { width:  stats + '%'}
        }

        return (
          <div className='ql-answer-content-container'>
            <div className={statClass} style={widthStyle}>
              {content}
            </div>
          </div>
        )
      })
    )
  }

  // Refine this
  renderShortAnswer (q) {
    return (
      <div className='ql-answer-content-container'>
        <div className='ql-short-answer'>
          <input type='text' />
        </div>
      </div>
    )
  }

  renderMultiSelect (q) {
    return (
      q.options.map((a) => {
        let content
        let stats = 0
        let statClass = 'stat-bar'
        let widthStyle = { width: '0%' }

        if (a.wysiwyg) {
          content = this.wysiwygContent(a.answer, a.content, a.correct)
        } else {
          content = this.commonContent('ms', a.answer, a.content, a.correct)
        }

        if (this.props.question.sessionOptions.stats) {
          stats = this.calculateStats(a.answer)

          if (stats > 0) {
            statClass += ' show-stats'

            if (this.props.question.sessionOptions.correct && a.correct) { 
              statClass += ' show-stats-correct'
            } else if (this.props.question.sessionOptions.correct && !(a.correct)) {
              statClass += ' show-stats-incorrect'
            }
          } 

          widthStyle = { width:  stats + '%'}
        }

        return (
          <div className='ql-answer-content-container'>
            <div className={statClass} style={widthStyle}>
              <input type="checkbox" className='ql-checkbox' />
              {content}
            </div>
          </div>
        )
      })
    )
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    if (this.props.question.sessionOptions.hidden) return <div className='container'>Waiting for a Question...</div>
    
    const q = this.props.question
    const type = q.type
    let content, buttons

    switch (type) {
      case QUESTION_TYPE.MC:
        content = this.renderMultipleChoice(q)
        break
      case QUESTION_TYPE.TF:
        content = this.renderTrueFalse(q)
        break
      case QUESTION_TYPE.SA:
        content = this.renderShortAnswer(q)
        // add onclick for reset
        buttons = (<div className='sa-buttons'>
          <button className='btn btn-default'>Submit</button>
          <button className='btn btn-default'>Reset</button> </div>)
        break
      case QUESTION_TYPE.MS:
        content = this.renderMultiSelect(q)
        break
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
  } // end render
}

export const QuestionDisplay = createContainer((props) => {
  const l = props.question.sessionOptions.attempts.length
  const attempt = props.question.sessionOptions.attempts[l - 1]

  const handle = Meteor.subscribe('answers.forQuestion', props.question._id) 
  const answers = Answers.find({ questionId: props.question._id, attempt: l }).fetch()

  const validOptions = _(props.question.options).pluck('answer')
  let total = answers.length

  const data = []
  let options = _(dl.groupby('answer').execute(answers)).sortBy('answer')
  
  options.map((a) => {
    a.counts = _(dl.groupby('attempt').count().execute(a.values)).sortBy('attempt')
    delete a.values
  })
  options = _(options).indexBy('answer')
  
  validOptions.forEach((key) => {
    data.push(options[key])
  })

  return {
    question: props.question,
    isQuiz: props.isQuiz,
    readonly: props.readonly,
    totalAnswered: total,
    distribution: data,
    loading: !handle.ready()
  }
}, _QuestionDisplay )

QuestionDisplay.propTypes = {
  question: PropTypes.object.isRequired,
  isQuiz: PropTypes.bool.isRequired,
  readonly: PropTypes.bool
}
