/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// session.jsx: page for display a running session to student

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import { Questions } from '../../../api/questions'
import { Sessions } from '../../../api/sessions'
import { QuestionDisplay } from '../../QuestionDisplay'

class _Session extends Component {

    constructor (props) {
        super(props)

        this.state = { 
            submittingQuestion: false,
            showResults: false
        }
    }

/*
TODO:
- differenciate between lecture & quiz mode (quiz would change current on click)
- show results part
- read only after submission

*/

    render () {
        const quiz = this.props.session.quiz
        const current = this.props.session.currentQuestion
        const q = current ? this.props.questions[current] : null
        const questionDisplay = this.props.user.hasRole('professor')
            ? <QuestionDisplay question={q} isQuiz={quiz} readonly />
            : <QuestionDisplay question={q} isQuiz={quiz} />
        return (
        <div className='container ql-session-display'>
            { q ? questionDisplay : '' }
        </div>)
    }

}

// meteor reactive data container
export const Session = createContainer((props) => {
    const handle = Meteor.subscribe('sessions') &&
    Meteor.subscribe('questions.inSession', props.sessionId)

    const session = Sessions.find({ _id: props.sessionId }).fetch()[0]
    let user = Meteor.users.find({ _id: Meteor.userId() }).fetch()[0]
    const questionsInSession = Questions.find({ _id: { $in: session.questions || [] } }).fetch()

    return {
        questions: _.indexBy(questionsInSession, '_id'), // question map
        user: user, // user object
        session: session, // session object
        loading: !handle.ready()
    }
}, _Session)

