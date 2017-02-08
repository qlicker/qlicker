/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// manage_course.jsx: page for managing a specific course

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'

import { Sessions } from '../../api/sessions.js'

import { CreateQuestionModal } from '../modals/CreateQuestionModal'

if (Meteor.isClient) import './manage_session.scss'

class ManageSession extends Component {

  constructor (props) {
    super(props)

    this.state = { editing: false, creatingQuestion: false, session: _.extend({}, this.props.session) }
    this.sessionId = this.props.sessionId
  
    this.handleSubmit = this.handleSubmit.bind(this)
    this.setValue = this.setValue.bind(this)
  }
  
  setValue (e) {
    let stateEdits = this.state
    let key = e.target.dataset.name
    if (key === 'quiz') stateEdits.session[e.target.dataset.name] === (e.target.value === 'true')
    else stateEdits.session[e.target.dataset.name] = e.target.value
    this.setState(stateEdits)
  }

  handleSubmit (e) {
    e.preventDefault();
    
    Meteor.call('sessions.edit', this.state.session, (error) => {
      if (error) {
        console.log(error)
        if (error.error === 'not-authorized') {
          // TODO
        } else if (error.error === 400) {
          // check didnt pass
        }
      } else {
        // done
        this.setState({ editing: false })
      }
    })
  }

  render () {
    const startEditing = () => { 
      this.setState({ editing: true })
    }
    const createQuestion = () => { 
      this.setState({ creatingQuestion: true })
    }
    const quizDate = this.state.quiz ? 'Deadline: ' + this.props.session.dueDate : ''
    const quizEdit = this.state.quiz ? 'Deadline: Date picker here' : ''
    return (
      <div className='container ui-manage-session'>
        <h2>Manage session: { this.state.session.name } </h2>
        { !this.state.editing ? <button ref='editButton' onClick={startEditing}>Edit Session</button> : '' }
        <form ref='editSessionForm' className='ui-form-editsession' onSubmit={this.handleSubmit}>
          Name: { this.state.editing ?
            <input type='text' data-name='name' onChange={this.setValue} value={this.state.session.name} /> :
            this.state.session.name }<br/>

          Description: { this.state.editing ?
            <textarea type='text' data-name='description' 
              onChange={this.setValue} 
              placeholder='Quiz on topic 3' 
              value={this.state.session.description} /> :
            this.state.session.description }<br/>

          Format: { this.state.editing ?
            <select data-name='quiz' onChange={this.setValue} defaultValue={this.state.session.quiz}>
              <option value={false}>Lecture Poll</option>
              <option value={true}>Online Quiz</option>
            </select> :
            this.state.session.quiz ? 'Quiz' : 'Lecture Poll' }<br/>

          Status: { this.state.editing ?
            <select data-name='status' onChange={this.setValue} defaultValue={this.state.session.status}>
              <option value='hidden'>Draft (Hidden)</option>
              <option value='visible'>Visible</option>
              <option value='running'>Active</option>
              <option value='done'>Done</option>
            </select>  :
            this.state.session.status }<br/>
          
          { this.state.editing ? quizDate : quizDate }
          { this.state.editing ? <input type='submit' /> : '' }
        </form>
      
        <h3>Questions</h3>
        <button ref='createQuestionButton' onClick={createQuestion}>Create Question</button>
        <div>{ this.state.creatingQuestion ? <CreateQuestionModal /> : '' }</div>

        <br/>
        <br/>
        Debug Info: 
        { JSON.stringify(this.state.session) }
      </div>)
  }

}

export default createContainer((props) => {
  const handle = Meteor.subscribe('sessions')
  let sessions = Sessions.find({ _id: props.sessionId }).fetch()[0]
  return {
    session: sessions,
    loading: !handle.ready()
  }
}, ManageSession)

