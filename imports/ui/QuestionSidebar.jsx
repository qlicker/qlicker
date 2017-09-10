// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionSidebar.jsx: vertical component to search for questions

import React, { PropTypes } from 'react'
import _ from 'underscore'

import { ControlledForm } from './ControlledForm'

import Select, { Creatable } from 'react-select'
import { QuestionListItem } from './QuestionListItem'
import { StudentQuestionListItem } from './StudentQuestionListItem'

import { QUESTION_TYPE, QUESTION_TYPE_STRINGS } from '../configs'

/**
 * React Component for displaying a list of Questions with text and tag based search and filtering.
 * Question click callback can be defined. Component often used to find and select a question
 * @param {Question[]} questions - array of questions
 * @param {Func} [onSelect] - call back for when question list item is click
 * @param {String} [clickMessage] - info message on what happens when you click on a question
 */
export class QuestionSidebar extends ControlledForm {

  constructor (props) {
    super(props)
    this.state = { questionPool: this.props.questions.slice(),
                   questionType: -1, courseId:-1, tags: [],
                  }

    this.setQuestion = this.setQuestion.bind(this)
    this.setSearchString = this.setSearchString.bind(this)
    this.setType = this.setType.bind(this)
    this.setCourseId = this.setCourseId.bind(this)
    this.setTags = this.setTags.bind(this)
    this.resetFilter = this.resetFilter.bind(this)
    this.deleteQuestion = this.deleteQuestion.bind(this)
    this.unApproveQuestion = this.unApproveQuestion.bind(this)
    // populate tagging suggestions
    this.tagSuggestions = []
    Meteor.call('questions.possibleTags', (e, tags) => {
      // non-critical, if e: silently fail
      tags.forEach((t) => {
        this.tagSuggestions.push({ value: t, label: t.toUpperCase() })
      })
      this.forceUpdate()
    })

    Meteor.call('courses.getCourseTagsProfile', (e, d) => {
      this.setState({courses: d})
    })
  }

  /**
   * Overrided done handler
   * @param {Event} e
   */
  done (e) {
    this.refs.addQuestionForm.reset()
    this.props.done()
  }

  /**
   * set selected question to add
   * @param {MongoId} questionId
   */
  setQuestion (questionId) {
    this.setState({ questionId: questionId }, () => {
      this.props.onSelect(questionId)
    })
  }

  /**
   * Set search term for plain text search & invoke filter
   * @param {Event} e
   */
  setSearchString (e) {
    this.setState({ searchString: e.target.value }, () => {
      this.props.updateQuery(this.state)
    })
  }

  /**
   * Set search term for plain text search & invoke filter
   * @param {Event} e
   */
  setType (e) {
    this.setState({ questionType: parseInt(e.target.value) }, () => {
      this.props.updateQuery(this.state)
    })
  }
  /**
   * Set course id & invoke filter
   * @param {Event} e
   */
  setCourseId(e) {
    let cId = e.target.value
    if (parseInt(cId) !== -1) {
      //set the corresponding course tag (user can always remove it)
      let tags = this.state.tags
      Meteor.call('courses.getCourseCodeTag', cId, (error, tag) => {
        //this does not seem to work, it adds it regardless...
         tlabels = _(tags).pluck('label')
         if (tag && !tlabels.includes(tag.label)){
           tags.push(tag)
           this.setTags(tags)
         }
      })
    }

    this.setState({ courseId: cId }, () => {
      this.props.updateQuery(this.state)
    })
  }
  /**
   * delete the question
   * @param {MongoId} questionId
   */
  deleteQuestion(questionId){
    if (confirm('Are you sure?')) {
      Meteor.call('questions.delete', questionId, (error) => {
        if (error) return alertify.error('Error: ' + error.error)
        alertify.success('Question Deleted')
      })
    }
  }
  /**
   * Set approved status to false
   * @param {MongoId} questionId
   */
  unApproveQuestion(questionId){
    if (confirm('Are you sure?')) {
      question = this.state.questionPool.find((q)=>{return q._id===questionId})
      if(question){
        question.approved=false
        Meteor.call('questions.update', question, (error, newQuestionId) => {
          if (error) return alertify.error('Error: ' + error.error)
          alertify.success('Question un-approved')
        })
    }
    }
  }
  /**
   * udpate state tags array
   * @param {Event} e
   */
  setTags (tags) {
    this.setState({ tags: tags }, () => {
      this.props.updateQuery(this.state)
    })
  }

  resetFilter(){
    this.refs.addQuestionForm.reset()
    this.setState({ searchString: '', questionType: -1, courseId:-1, tags: [], }, ()=>{
      this.props.updateQuery(this.state)
    })
  }

  componentWillReceiveProps (nextProps) {
    this.setState({ questionPool: nextProps.questions.slice() })
    if(nextProps.resetFilter) this.resetFilter()
  }

  render () {
    const showMore = !this.props.atMax ? <div className={'cursor-pointer ql-list-item col-md-' + (this.props.questions.length === 10 ? '12' : '6')} onClick={() => this.props.increase(this.state)}>
      <span className='ql-question-name'> <span className='glyphicon glyphicon-plus'></span> Show more</span>
    </div> : ''

    const showLess = this.props.questions.length > 10 ? <div className={'cursor-pointer ql-list-item col-md-' + (this.props.atMax ? '12' : '6')} onClick={() => this.props.decrease(this.state)}>
      <span className='ql-question-name'> <span className='glyphicon glyphicon-minus'></span> Show less</span>
    </div> : ''

    const isInstructor = Meteor.user().isInstructorAnyCourse()
    const userId = Meteor.userId()
    return (
      <div className='ql-question-sidebar' >
        <form ref='addQuestionForm' className='ql-form-addquestion' onSubmit={this.handleSubmit}>

          <select value={this.state.type} onChange={this.setType} className='ql-header-button question-type form-control'>
            <option key={-1} value={-1}>Any type</option>
            {
              _(QUESTION_TYPE).keys().map((k) => {
                const val = QUESTION_TYPE[k]
                return <option key={k} value={val}>{ QUESTION_TYPE_STRINGS[val] }</option>
              })
            }
          </select>
          {this.state.courses && this.state.courses.length>1 ?
            <select value= {this.state.courseId}  onChange={this.setCourseId} className='ql-header-button question-type form-control'>
              <option key={-1} value={-1} >Any course</option>
              { this.state.courses
               ? this.state.courses.map((obj) => {
                  return <option key={obj._id} value={obj._id} >{ obj.code }</option>
                 })
               : ''
              }
            </select>
            : ''
          }

          <Select
            name='tag-input'
            placeholder='Type to search by tag'
            multi
            value={this.state.tags}
            options={this.tagSuggestions}
            onChange={this.setTags}
            />
          <input type='text' className='form-control search-field' placeholder='Search by question content' onChange={_.throttle(this.setSearchString, 500)} />
          <div className='btn-group btn-group-justified details-button-group'>
            <div className='btn btn-default' onClick={this.resetFilter}>Reset search filter
            </div>
          </div>
          <br />
          {
            this.props.clickMessage
            ? <div className='center-text'>{this.props.clickMessage}<br /></div> : ''
          }
          <div className='ql-question-list'>
            { /* list questions */
              this.state.questionPool.map(q => {
                controls = []
                if(q.owner === userId) controls.push({label:'delete', click : () => this.deleteQuestion(q._id) })
                if( (q.owner !== userId || q.creator !== userId ) && q.approved && isInstructor){
                  controls.push({label:'un-approve', click : () => this.unApproveQuestion(q._id) })
                }

                return (<div key={q._id} className={this.state.questionId === q._id ? 'list-item-selected' : ''}>
                  { !q.courseId
                    ? <QuestionListItem
                         question={q}
                         session={this.props.session}
                         controls={controls.length > 0 ? controls: ''}
                         click={() => this.setQuestion(q._id)} />
                    : <StudentQuestionListItem
                         question={q}
                         controls={controls.length > 0 ?  controls: ''}
                         click={() => this.setQuestion(q._id)} /> }
                </div>)
              })
            }
            <br />
            <div className='row border-between'>
              {showMore}
              {showLess}
            </div>
          </div>
        </form>
      </div>)
  } //  end render

} // end QuestionSidebar

QuestionSidebar.propTypes = {
  session: PropTypes.object,
  questions: PropTypes.array.isRequired,
  onSelect: PropTypes.func,
  clickMessage: PropTypes.string,
  increase: PropTypes.func,
  decrease: PropTypes.func,
  updateQuery: PropTypes.func,
  atMax: PropTypes.bool,
  resetFilter: PropTypes.bool
}
