// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionSidebar.jsx: vertical component to search for questions

import React, { PropTypes } from 'react'
import _ from 'underscore'

import { ControlledForm } from './ControlledForm'

import { Creatable } from 'react-select'
import { QuestionListItem } from './QuestionListItem'
import { StudentQuestionListItem } from './StudentQuestionListItem'

import { QUESTION_TYPE, QUESTION_TYPE_STRINGS } from '../configs'

export class QuestionSidebar extends ControlledForm {

  constructor (props) {
    super(props)
    this.state = { questionPool: this.props.questions.slice(), questionType: -1, tags: [] }

    this.setQuestion = this.setQuestion.bind(this)
    this.setSearchString = this.setSearchString.bind(this)
    this.setType = this.setType.bind(this)
    this.setTags = this.setTags.bind(this)
    this.filterPool = this.filterPool.bind(this)
    this._DB_filterPool = _.debounce(this.filterPool, 200)

    // populate tagging suggestions
    this.tagSuggestions = []
    Meteor.call('questions.possibleTags', (e, tags) => {
      // non-critical, if e: silently fail
      tags.forEach((t) => {
        this.tagSuggestions.push({ value: t, label: t.toUpperCase() })
      })
      this.forceUpdate()
    })
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
    this.setState({ questionId: questionId }, () => {
      this.props.onSelect(questionId)
      // this._DB_filterPool()
    })
  }

  /**
   * setSearchString(Event: e)
   * Set search term for plain text search & invoke filter
   */
  setSearchString (e) {
    this.setState({ searchString: e.target.value }, () => {
      this._DB_filterPool()
    })
  }

  /**
   * setType(Event: e)
   * Set search term for plain text search & invoke filter
   */
  setType (e) {
    this.setState({ questionType: parseInt(e.target.value) }, () => {
      this._DB_filterPool()
    })
  }

  /**
   * setTags(Event: e)
   * udpate state tags array
   */
  setTags (tags) {
    this.setState({ tags: tags }, () => {
      this._DB_filterPool()
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

      const hasTag = this.state.tags.length > 0
        ? _.intersection(_(q.tags).pluck('value'), _(this.state.tags).pluck('value')).length > 0
        : true

      return (inQuestion || inAnswers) && correctType && hasTag
    })

    this.setState({ questionPool: pool })
  }

  componentWillReceiveProps (nextProps) {
    this.setState({ questionPool: nextProps.questions.slice() }, () => {
      this.filterPool()
    })
  }

  render () {
    return (
      <div className='ql-question-sidebar' >
        <form ref='addQuestionForm' className='ql-form-addquestion' onSubmit={this.handleSubmit}>

          <input type='text' className='form-control search-field' placeholder='Search Term' onChange={_.throttle(this.setSearchString, 500)} />

          <select defaultValue={this.state.type} onChange={this.setType} className='ql-header-button question-type form-control'>
            <option key={-1} value={-1}>Any Type</option>
            {
              _(QUESTION_TYPE).keys().map((k) => {
                const val = QUESTION_TYPE[k]
                return <option key={k} value={val}>{ QUESTION_TYPE_STRINGS[val] }</option>
              })
            }
          </select>

          <Creatable
            name='tag-input'
            placeholder='Search by Tag'
            multi
            value={this.state.tags}
            options={this.tagSuggestions}
            onChange={this.setTags}
            />
          <br />
          { /* list questions */
            this.state.questionPool.map(q => {
              return (<div key={q._id} className={this.state.questionId === q._id ? 'list-item-selected' : ''}>
                { !q.courseId
                  ? <QuestionListItem question={q} click={() => this.setQuestion(q._id)} />
                  : <StudentQuestionListItem question={q} click={() => this.setQuestion(q._id)} /> }
              </div>)
            })
          }

        </form>
      </div>)
  } //  end render

} // end QuestionSidebar

QuestionSidebar.propTypes = {
  session: PropTypes.object,
  questions: PropTypes.array.isRequired,
  onSelect: PropTypes.func
}
