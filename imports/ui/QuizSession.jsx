import React, { Component } from 'react'
import ReactDOM from 'react-dom'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import { Questions } from '../api/questions'
import { Sessions } from '../api/sessions'
import { Responses, responseDistribution } from '../api/responses'

import { QuestionDisplay } from './QuestionDisplay'
import { ShortAnswerList } from './ShortAnswerList'
import { QUESTION_TYPE } from '../configs'

class _QuizSession extends Component {

  constructor (props) {
    super(props)

    this.state = {questionsToTryAgain: []}

    this.scrollTo = this.scrollTo.bind(this)
    this.submitQuiz = this.submitQuiz.bind(this)
    if (Meteor.user().isStudent(this.props.session.courseId)) Meteor.call('sessions.join', this.props.session._id, Meteor.userId())

  }

  componentDidMount () {
    if (this.props.session){
      Meteor.call('sessions.quizSubmitted', this.props.session._id, (err, submitted) =>{
        if(err) alertify.error(err.error)
        if(!err && submitted) {
          this.setState({submitted:true})
        }
      })
    }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.session){
      Meteor.call('sessions.quizSubmitted', nextProps.session._id, (err, submitted) =>{
        if(err) alertify.error(err.error)
        if(!err && submitted) {
          this.setState({submitted:true})
        }
      })
    }
  }


  scrollTo (qId) {
    const node = ReactDOM.findDOMNode(this.refs["qdisp"+qId])
    if (node) window.scrollTo({ top: node.offsetTop, behavior: 'smooth' })
  }

  submitQuiz () {
    //Calll a method to unset the editable part of the responses.
    if (confirm('Are you sure? You can no longer update answers after submitting.')) {
      Meteor.call('sessions.submitQuiz', this.props.session._id, (err) => {
        if (err) return alertify.error('Error: ' + err.message)
       alertify.success('Quiz submitted')
       Router.go('course', { courseId: this.props.session.courseId })
      })
    }
  }


  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const cId = this.props.session.courseId
    const user = Meteor.user()
    if (!user.isStudent(cId) && !user.isInstructor(cId)) {
      Router.go('login')
    }
    if (this.state.submitted/*this.props.session.quizCompleted(user._id)*/){
      Router.go('/course/' + this.props.session.courseId)
    }
    const status = this.props.session.status
    if (status !== 'running' && !this.props.session.quizIsActive()) {
      let statusMessage
      if (status === 'visible') statusMessage = 'This session has not started yet. You can keep this page open until your professor starts the session or check back soon.'
      if (status === 'done') {
        statusMessage = 'This session has finished'
        if (user && !user.isInstructor(cId)) {
          // if it's an instructor, this is being shown as a second display, so dont't
          // go to the course page and show everyone the class list
          Router.go('/course/' + this.props.session.courseId)
        }
      }
      return <div className='ql-subs-loading'>{statusMessage}</div>
    }


    const session = this.props.session
    const qlist = session.questions
    if (qlist.length < 1) return <div className='ql-subs-loading'>No questions in session</div>
    let qCount = 0
    let qCount2 = 0
    const canSubmit = this.props.myResponses && this.props.myResponses.length === qlist.length && !this.state.submitted


    const scrollToFirst = () => this.scrollTo(qlist[0])
    return (
      <div className='container ql-quiz-session'>
        <div className='row'>
          <div className='col-md-2 hidden-sm hidden-xs'>
            <div className='ql-quiz-session-qnav'>
              <div className='ql-quiz-session-qnav-title'>Questions</div>
              <div  className='ql-quiz-session-qnav-qlist'>
                { qlist.map( (qid) => {
                    qCount +=1
                    let className='ql-quiz-session-questionPad'
                    const click = () => this.scrollTo(qid)
                    //const responses = _.where(this.props.myResponses, { questionId: qid })
                    //let response =  responses.length > 0 ? _.max(responses, (resp) => { return resp.attempt }) : undefined

                    let response = _(this.props.myResponses).findWhere({ questionId:qid })
                    if (!response) response = undefined

                    if (response) className += ' green'
                    else className += ' red'

                    return (
                      <div className={className} key={"qnav"+qid} onClick={click}> {qCount}</div>
                    )
                  })
                }
              </div>
              {canSubmit ?
                <div className='ql-quiz-submit-button'>
                  <div className='btn-group btn-group-justified'>
                    <div className='btn btn-primary' onClick={this.submitQuiz}>
                      Submit!
                    </div>
                  </div>
                </div>

                :''
              }
            </div>
          </div>
          <div className='col-md-10'>
            <div className='ql-quiz-session-questions'>
              <div className='ql-quiz-session-questions-title'> {session.name ? session.name : ''} </div>
              { qlist.map( (qid) => {

                  qCount2 += 1
                  const q = this.props.questions[qid]
                  if (!q || !q.sessionOptions) return <div className='ql-subs-loading'>Loading</div>

                  //const responses = _.where(this.props.myResponses, { questionId: qid })
                  //let response =  responses.length >0 ? _.max(responses, (resp) => { return resp.attempt }) : undefined
                  let response = _(this.props.myResponses).findWhere({ questionId:qid })
                  let readOnly = undefined
                  if (!response) response = undefined
                  else{
                    if (!response.editable) readOnly = true
                  }
                  const questionDisplay = user.isInstructor(session.courseId)
                    ? <QuestionDisplay question={q} readOnly />
                    : <QuestionDisplay
                        question={q}
                        isQuiz={true}
                        response={response}
                        readOnly={readOnly}
                        attemptNumber={1} />

                  return (
                    <div className='ql-quiz-session-question' ref={"qdisp"+qid} key={"qdisp"+qid} >
                      <div className='ql-quiz-session-question-title'>
                        Question {qCount2} of {qlist.length}
                      </div>
                      { q ? questionDisplay : '' }
                    </div>
                  )
                })
              }
              {canSubmit ?
                <div className='ql-quiz-submit-button'>
                  <div className='btn-group btn-group-justified'>
                    <div className='btn btn-primary' onClick={this.submitQuiz}>
                      Submit!
                    </div>
                  </div>
                </div>
                :''
              }
            </div>
          </div>
        </div>

      </div>
    )
  }

}

export const QuizSession = createContainer((props) => {
  const handle = Meteor.subscribe('sessions.single', props.sessionId) &&
    Meteor.subscribe('questions.inSession', props.sessionId) &&
    Meteor.subscribe('responses.forQuiz', props.sessionId)

  const session = Sessions.findOne({ _id: props.sessionId })
  const questionsInSession = session ? Questions.find({_id: { $in: session.questions }}).fetch() : []
  // The user's responses
  const allMyResponses = session ? Responses.find({ questionId: { $in: session.questions },
                                                    studentUserId: Meteor.userId(),
                                                    attempt: 1 }).fetch() : []
  return {
    questions: _.indexBy(questionsInSession, '_id'), // question map
    session: session, // session object
    myResponses: allMyResponses, // responses related to this session
    loading: !handle.ready()
  }
}, _QuizSession)
