// QLICKER
// CreatePracticeQuizModal.jsx

import React, { PropTypes } from 'react'

import { ControlledForm } from '../ControlledForm'
import '../../api/users.js'
import _ from 'underscore'
import Select from 'react-select'

import 'react-select/dist/react-select.css'

/**
 * modal students to create a practice quiz
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
export class CreatePracticeQuizModal extends ControlledForm {

  constructor (props) {
    super(props)
    this.state = {
      tags: [],
      tagSuggestions: []
    }

    this.setTags = this.setTags.bind(this)
  }

  componentWillReceiveProps (nextProps) {
    Meteor.call('questions.possibleTags', nextProps.courseId, (e, tags) => {
      tags.forEach((t) => {
        tagSuggestions.push({ value: t, label: t.toUpperCase() })
      })
      this.setState({ tagSuggestions: tagSuggestions })
    })
    if (nextProps.courseId !== this.props.courseId) {
      this.setTags([])
    }
  }

  componentDidMount () {
    Meteor.call('questions.possibleTags', this.props.courseId, (e, tags) => {
      // non-critical, if e: silently fail
      tagSuggestions = []
      tags.forEach((t) => {
        tagSuggestions.push({ value: t, label: t.toUpperCase() })
      })
      this.setState({tagSuggestions: tagSuggestions})
    })
  }

  setTags (tags) {
    this.setState({ tags: tags }, () => {
      this.updateQuery()
    })
  }

  updateQuery () {
    let query = {}

    if (this.state.tags.length) query['tags.value'] = { $all: _.pluck(this.state.tags, 'value') }
  }

  /**
   * done(Event: e)
   * Overrided done handler
   */
  done (e) {
    this.setState({})
    this.props.done()
  }

  /**
   * handleSubmit(Event: e)
   * onSubmit handler for add TA form. Calls courses.addTA
   */
  handleSubmit (e) {
    super.handleSubmit(e)

    if (Meteor.isTest) {
      this.props.done()
    }

    Meteor.call('courses.addStudentByEmail', this.state.newEmail, this.props.courseId, (error) => {
      if (error) return alertify.error('Error: ' + error.message)
      this.done()
    })
  }

  render () {
    return (<div className='ql-modal-container' onClick={this.done}>
      <div className='ql-modal  ql-card' onClick={this.preventPropagation}>

        <div className='ql-modal-header ql-header-bar'>
          <h3>
            Create a Practice Quiz
          </h3>

        </div>
        <form className='ql-card-content' onSubmit={this.handleSubmit}>

          <div className='ql-modal-createpracquiz'>

            <h5>
              Number of questions:
              &nbsp;<input type='number' className='numberField' min='0' max={100} step={1} maxLength='4' size='7' />
            </h5>

            <Select
              name='tag-input'
              placeholder='Type to search by tag'
              multi
              value={this.state.tags}
              options={this.state.tagSuggestions}
              onChange={this.setTags}
            />
          </div>

          <div className='ql-buttongroup'>
            <a className='btn btn-default' onClick={this.done}>Create Practice Quiz</a>
          </div>
        </form>
      </div>
    </div>)
  } //  end render

}

CreatePracticeQuizModal.propTypes = {
  done: PropTypes.func,
  courseId: PropTypes.string,
  courseName: PropTypes.string
}
