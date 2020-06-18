// QLICKER
// Author: Enoch T <me@enocht.am>
//
// QuestionSidebar.jsx: vertical component to search for questions

import React from 'react';
import PropTypes from 'prop-types';
import { withTracker }  from 'meteor/react-meteor-data'
import _ from 'underscore'

import { ControlledForm } from './ControlledForm'

import Select from 'react-select'
import 'react-select/dist/react-select.css'

import { QuestionListItem } from './QuestionListItem'
import { StudentQuestionListItem } from './StudentQuestionListItem'

import { QUESTION_TYPE, QUESTION_TYPE_STRINGS } from '../configs'

import { Questions, defaultQuestion, questionQueries } from '../api/questions'
import { Courses } from '../api/courses'

/**
 * React Component for displaying a list of Questions with text and tag based search and filtering.
 * Question click callback can be defined. Component often used to find and select a question
 * @param {Question[]} questions - array of questions
 * @param {Func} [onSelect] - call back for when question list item is click
 * @param {String} [clickMessage] - info message on what happens when you click on a question
 */
export class _QuestionSidebar extends ControlledForm {

//TODO: probably needs to subscribe to users for the search bar...
  constructor (props) {
    super(props)
    this.state = {
      questionPool: this.props.questions.slice(10),
      questionType: -1,
      //showOnlyApprovedQuestions: false,
      tags: [],
      tagSuggestions : [],
      limit : 10,
      atMaxLimit: false,
      nQuery: 0
    }

    this.setQuestion = this.setQuestion.bind(this)
    this.setSearchString = this.setSearchString.bind(this)
    this.setUserSearchString = this.setUserSearchString.bind(this)
    this.setType = this.setType.bind(this)
    //this.showApproved = this.showApproved.bind(this)
    this.setTags = this.setTags.bind(this)
    this.resetFilter = this.resetFilter.bind(this)
    this.deleteQuestion = this.deleteQuestion.bind(this)
    this.approveQuestion = this.approveQuestion.bind(this)
    this.unApproveQuestion = this.unApproveQuestion.bind(this)
    this.copyQuestion = this.copyQuestion.bind(this)
    this.updateQuery = this.updateQuery.bind(this)
    this.increaseLimit = this.increaseLimit.bind(this)
    this.decreaseLimit = this.decreaseLimit.bind(this)

  } //end constructor

  componentWillReceiveProps (nextProps) {

    // Need to update possible tags, since question sidebar is showing when questions
    // are being edited and tags created...
    //console.log("received new props")
    //console.log(nextProps)

//    if(nextProps.selected.tags !== this.props.selected.tags)
    Meteor.call('questions.possibleTags',  nextProps.courseId, (e, tags) => {
      // non-critical, if e: silently fail
      let tagSuggestions = []
      tags.forEach((t) => {
        tagSuggestions.push({ value: t, label: t.toUpperCase() })
      })
      this.setState({ tagSuggestions:tagSuggestions })
    })

    // Decide wether to reset the sidebar form
    if (nextProps.resetSidebar || nextProps.questionLibrary !== this.props.questionLibrary){
      this.resetFilter()
    }
    //Decide whether or not to update the question pool
    // questions length could change if a question was deleted
    else if (nextProps.questions.length !== this.props.questions.length || this.state.questionPool.length < 1 ) {
      const nQuery = Questions.find(nextProps.libQuery).count()
      const newQuestions = Questions.find(nextProps.libQuery, {sort:{createdAt: -1 }, limit:this.state.limit}).fetch()
      let atMaxLimit = false
      if (newQuestions.length >= nQuery ) atMaxLimit = true

      this.setState({ questionPool: newQuestions, atMaxLimit:atMaxLimit, nQuery:nQuery })
    }
    else if (nextProps.questions !== this.props.questions) {
      this.updateQuery()
    }
    else {}

    if(nextProps.courseId !== this.props.courseId){
      this.setTags([])
    }
  }

  componentDidMount() {
    Meteor.call('questions.possibleTags', this.props.courseId, (e, tags) => {
      // non-critical, if e: silently fail
      let tagSuggestions = []
      tags.forEach((t) => {
        tagSuggestions.push({ value: t, label: t.toUpperCase() })
      })
      let atMaxLimit = false
      let nQuery =  Questions.find(this.props.libQuery).count()
      const newQuestions = Questions.find(this.props.libQuery, {sort:{createdAt: -1 }, limit:this.state.limit}).fetch()
      if( this.props.questions && this.props.questions.length >= nQuery) atMaxLimit = true
      this.setState({tagSuggestions: tagSuggestions, nQuery: nQuery, atMaxLimit:atMaxLimit, questionPool: newQuestions})
      //this.forceUpdate()
    })
  }

  increaseLimit(){
    this.setState({ limit:this.state.limit + 10 }, () => {
      this.updateQuery()
    })
  }

  decreaseLimit(){
    if (this.state.limit >11) this.setState({ limit:this.state.limit - 10 }, () => {
      this.updateQuery()
    })
  }
  /**
   * set selected question to add
   * @param {MongoId} question
   */
  setQuestion (question) {
    //console.log('setting question')
    this.setState({ question: question }, () => {
      if(this.props.onSelect) this.props.onSelect(question)
    })
  }
  /**
   * Set search term for user search & invoke filter
   * @param {Event} e
   */
  setUserSearchString (e) {
    this.setState({ userSearchString: e.target.value }, () => {
      this.updateQuery()
    })
  }

  /**
   * Set search term for plain text search & invoke filter
   * @param {Event} e
   */
  setSearchString (e) {
    this.setState({ searchString: e.target.value }, () => {
      this.updateQuery()
    })
  }

  /**
   * Set search term for plain text search & invoke filter
   * @param {Event} e
   */
  setType (e) {
    this.setState({ questionType: parseInt(e.target.value), courseId: this.props.courseId }, () => {
      this.updateQuery()
    })
  }
/*
  showApproved () {
    this.setState({ showOnlyApprovedQuestions: !this.state.showOnlyApprovedQuestions }, () => {
      this.updateQuery()
    })
  }*/

  /**
   * delete the question
   * @param {MongoId} questionId
   */
  deleteQuestion (questionId) {
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
  unApproveQuestion (questionId) {
    let question = this.state.questionPool.find((q) => { return q._id === questionId })
    if (question) {
      question.approved = false
      question.public = false // public questions should be approved
      question.owner = question.creator
      Meteor.call('questions.update', question, (error, newQuestionId) => {
        if (error) return alertify.error('Error: ' + error.error)
        alertify.success('Question un-approved')
      })
    }
  }
  /**
   * Set approved status to true and take ownership
   * @param {MongoId} questionId
   */
  approveQuestion (questionId) {
    let question = this.state.questionPool.find((q) => { return q._id === questionId })
    let userId = Meteor.userId()
    if (question && userId) {
      question.approved = true
      question.owner = userId
      Meteor.call('questions.update', question, (error, newQuestionId) => {
        if (error) return alertify.error('Error: ' + error.error)
        alertify.success('Question approved')
      })
    }
  }
  copyQuestion (questionId) {
    user = Meteor.user()
    if(!user.isInstructor(this.props.courseId)) {
      alertify.error('Only instructor can copy')
      return
    }

    Meteor.call('questions.copy', questionId, (error, newQuestion) => {
      if (error) return alertify.error('Error: ' + error.error)
      alertify.success('Question copied')
    })

  }
  /**
   * udpate state tags array
   * @param {Event} e
   */
  setTags (tags) {
    this.setState({ tags: tags }, () => {
      this.updateQuery()
    })
  }

  resetFilter () {
    if(this.refs && this.refs.addQuestionForm) this.refs.addQuestionForm.reset()

    const nQuery = Questions.find(this.props.libQuery).count()
    const newQuestions = Questions.find(this.props.libQuery, {sort:{createdAt: -1 }, limit:this.state.limit}).fetch()
    let atMaxLimit = false
    if (newQuestions.length >= nQuery ) atMaxLimit = true

   //this calls update query, so the above is useselles! start from scratch!
    this.setState({ searchString: '', userSearchString: '', questionPool: newQuestions,
                    atMaxLimit:atMaxLimit, nQuery:nQuery,
                    questionType: -1, tags: [], limit:10 }, () => {
      this.updateQuery()
    })
  }

  updateQuery () {

    if (this.props.setFilter) this.props.setFilter(false)

    let query = {}

    if (this.state.questionType > -1) query.type = this.state.questionType
    //if (this.state.showOnlyApprovedQuestions) query.approved = this.state.showOnlyApprovedQuestions
    //if (parseInt(this.state.courseId) !== -1) query.courseId = this.state.courseId
    if (this.state.searchString) query.plainText = {$regex: '.*' + this.state.searchString + '.*', $options: 'i'}
    if (this.state.userSearchString) {
      const users = Meteor.users.find({ $or: [{'profile.lastname': {$regex: '.*' + this.state.userSearchString + '.*', $options: 'i'}},
                                               {'profile.firstname': {$regex: '.*' + this.state.userSearchString + '.*', $options: 'i'}}] }).fetch()
      const uids = _(users).pluck('_id')
      query.creator = {$in: uids}
    }
    if (this.state.tags.length) query['tags.value'] = { $all: _.pluck(this.state.tags, 'value') }

/*
    if (this.props.library !== 'sharedWithUser') {
      query.courseId = this.props.courseId
    }*/
    query = _.extend(query, this.props.libQuery)

    const nQuery = Questions.find(query).count()

    const newQuestions = Questions.find(query, {sort:{createdAt: -1 }, limit:this.state.limit}).fetch()
    let atMaxLimit = false
    if (newQuestions.length >= nQuery ) atMaxLimit = true

    this.setState({ questionPool: newQuestions, atMaxLimit:atMaxLimit, nQuery:nQuery })
  }



  render () {

    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const isInstructor = Meteor.user().isInstructor(this.props.courseId)
    const isStudent = Meteor.user().isStudent(this.props.courseId)
    const userId = Meteor.userId()
    const showIncrease = !this.state.atMaxLimit && this.state.questionPool.length > 0
    const showDecrease = this.state.questionPool.length > 10

    const showMore = <div className={'cursor-pointer ql-list-item col-md-' + (showIncrease ? '12' : '6')} onClick={() => this.increaseLimit()}>
     <span className='ql-question-name'> <span className='glyphicon glyphicon-plus' /> Show more</span>
     </div>

    const showLess =  <div className={'cursor-pointer ql-list-item col-md-' + (showDecrease ? '12' : '6')} onClick={() => this.decreaseLimit()}>
     <span className='ql-question-name'> <span className='glyphicon glyphicon-minus' /> Show less</span>
     </div>

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

          <Select
            name='tag-input'
            placeholder='Type to search by tag'
            multi
            value={this.state.tags}
            options={this.state.tagSuggestions}
            onChange={this.setTags}
            />
          <input type='text' className='form-control search-field' placeholder='Search by question content' onChange={_.throttle(this.setSearchString, 500)} />
          {
            isInstructor
            ? <input type='text' className='form-control search-field' placeholder='Search by question creator' onChange={_.throttle(this.setUserSearchString, 500)} />
            : ''
          }
          <div className='btn-group btn-group-justified details-button-group'>
            <div className='btn btn-default' onClick={this.resetFilter}>Reset search filter
            </div>
          </div>
          <br />
          {
            this.props.clickMessage
            ? <div className='center-text'>{this.props.clickMessage}<br /></div> : ''
          }
          { this.state.nQuery > 0 ?
              <div> Showing {this.state.questionPool.length} of {this.state.nQuery} questions </div>
            : <div> Showing {this.state.questionPool.length} questions </div>
          }
          <div className='ql-question-list'>
            { /* list questions */
              this.state.questionPool.length > 0  ?
                this.state.questionPool.map(q => {
                  let controls = []
                  if (q.owner === userId) controls.push({label: 'delete', click: () => this.deleteQuestion(q._id)})
                  if ((q.owner !== userId || q.creator !== userId) && q.approved && isInstructor) {
                    controls.push({label: 'un-approve', click: () => this.unApproveQuestion(q._id)})
                  }
                  if ((q.owner !== userId || q.creator !== userId) && !q.approved && isInstructor) {
                    controls.push({label: 'approve', click: () => this.approveQuestion(q._id)})
                  }
                  if (isInstructor){
                    controls.push({label: 'duplicate', click: () => this.copyQuestion(q._id)})
                  }

                  return (
                  <div key={q._id} className={this.props.selected && this.props.selected._id === q._id ? 'list-item-selected' : ''}>
                    { !q.courseId
                      ? <QuestionListItem
                        courseId={q.courseId}
                        question={q}
                        session={this.props.session}
                        controls={controls.length > 0 ? controls : ''}
                        click={() => this.setQuestion(q)} />
                     : <StudentQuestionListItem
                          question={q}
                          controls={controls.length > 0 ? controls : ''}
                          click={() => this.setQuestion(q)} /> }
                    </div>)
                  })
                : <div>
                    { this.state.nQuery > 0 ?
                       <div className='ql-subs-loading'>Loading</div>
                      : <div>No questions</div>
                    }
                  </div>
            }
            {showIncrease ?
              showMore : ''}
            {showDecrease ?
              showLess : ''}
          </div>
        </form>
      </div>)
  } //  end render

} // end QuestionSidebar

export const QuestionSidebar = withTracker((props) => {

  //const subscription = 'questions.' + props.questionLibrary
  //const handle =  Meteor.subscribe(subscription, props.courseId)
  const handle = Meteor.subscribe('questions.library', props.courseId) &&
                 Meteor.subscribe('questions.public', props.courseId)
                 Meteor.subscribe('questions.unapprovedFromStudents', props.courseId)

  const user = Meteor.user()
  const isInstructor = user.isInstructor(props.courseId)

  let libQuery = {} //need to enforce the query for the library that is passed, as this would otherwise show all questions loaded in components above it
  switch (props.questionLibrary) {
    case 'library':
      libQuery = isInstructor ? questionQueries.queries.library.instructor
                              : _.extend(questionQueries.queries.library.student, {'$or': [{ creator: user._id }, { owner: user._id }]})
      break;
    case 'public':
      libQuery =  questionQueries.queries.public
      break;
    case 'unapprovedFromStudents':
      libQuery = questionQueries.queries.unapprovedFromStudents
      break;

    default:
    libQuery = isInstructor ? questionQueries.queries.library.instructor
                            : questionQueries.queries.library.student
    break;
  }
  const options = _.extend(questionQueries.options.sortMostRecent)

  const questions = Questions.find(libQuery, options).fetch()

  //console.log("Questions in sidebar from subscription")
  //console.log(questions)

  return {
    loading: !handle.ready(),
    questions: questions,
    libQuery: libQuery,
    selected: props.selected,
    done: () => console.log('')
  }

})(_QuestionSidebar)

QuestionSidebar.propTypes = {
  session: PropTypes.object,
  courseId: PropTypes.string,
  onSelect: PropTypes.func,
  clickMessage: PropTypes.string,
  resetSideBar: PropTypes.bool,
  setFilter: PropTypes.func,
  filter: PropTypes.object //Optional query
}
