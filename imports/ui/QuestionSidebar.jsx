// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionSidebar.jsx: vertical component to search for questions

import React, { PropTypes } from 'react'
import _ from 'underscore'

import { ControlledForm } from './ControlledForm'

import { QuestionListItem } from './QuestionListItem'

import { QUESTION_TYPE, QUESTION_TYPE_STRINGS } from '../configs'

export class QuestionSidebar extends ControlledForm {

  constructor (props) {
    super(props)
    this.state = { questionPool: this.props.questions.slice(), questionType: -1 }

    this.setQuestion = this.setQuestion.bind(this)
    this.setSearchString = this.setSearchString.bind(this)
    this.setType = this.setType.bind(this)
    this.filterPool = this.filterPool.bind(this)
  }

  /**
   * done(Event: e)
   * Overrided done handler
   */
  done (e) {
    this.refs.addQuestionForm.reset()
    this.props.done()
  }

  /**
   * setQuestion(MongoId (String): questionId)
   * set selected question to add
   */
  setQuestion (questionId) {
    this.setState({ questionId: questionId })
    this.props.onSelect(questionId)
  }

  /**
   * setSearchString(Event: e)
   * Set search term for plain text search & invoke filter
   */
  setSearchString (e) {
    this.setState({ searchString: e.target.value }, () => {
      this.filterPool()
    })
  }

  /**
   * setType(Event: e)
   * Set search term for plain text search & invoke filter
   */
  setType (e) {
    this.setState({ questionType: parseInt(e.target.value) }, () => {
      this.filterPool()
    })
  }

  /**
   * filterPool(String: str)
   * filters items from the this.state.questionPool
   */
  filterPool () {
    const pool = _(this.props.questions.slice()).filter((q) => {
      const inQuestion = this.state.searchString
        ? q.plainText.toLowerCase().includes(this.state.searchString.toLowerCase())
        : true

      const inAnswers = false // TODO or in any of the answers

      const correctType = (this.state.questionType === -1) || (q.type === this.state.questionType)

      return (inQuestion || inAnswers) && correctType
    })

    this.setState({ questionPool: pool })
  }

  componentWillReceiveProps (nextProps) {
    this.setState({ questionPool: nextProps.questions.slice() })
  }

  render () {
    return (
      <div className='ql-question-sidebar' >
        <form ref='addQuestionForm' className='ql-form-addquestion' onSubmit={this.handleSubmit}>

          <h3>Search and Filtering</h3>
          <input type='text' className='form-control' onChange={_.throttle(this.setSearchString, 500)} />

          <select defaultValue={this.state.type} onChange={this.setType} className='ql-header-button question-type form-control'>
            <option key={-1} value={-1}>Any Type</option>
            {
              _(QUESTION_TYPE).keys().map((k) => {
                const val = QUESTION_TYPE[k]
                return <option key={k} value={val}>{ QUESTION_TYPE_STRINGS[val] }</option>
              })
            }
          </select>

          { /* list questions */
            this.state.questionPool.map(q => {
              return (<div key={q._id} className={this.state.questionId === q._id ? 'correct-color' : ''}>
                { <QuestionListItem question={q} click={() => this.setQuestion(q._id)} /> }
              </div>)
            })
          }

        </form>
      </div>)
  } //  end render

} // end QuestionSidebar

QuestionSidebar.propTypes = {
  session: PropTypes.object.isRequired,
  questions: PropTypes.array.isRequired
}
