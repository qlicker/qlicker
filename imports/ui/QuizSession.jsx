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

  }

  scrollTo (qId) {
    const node = ReactDOM.findDOMNode(this.refs["qdisp"+qId])
    if (node) window.scrollTo({ top: node.offsetTop, behavior: 'smooth' })
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    const session = this.props.session
    const qlist = session.questions
    if (qlist.length < 1) return <div className='ql-subs-loading'>No questions in session</div>
    let qCount = 0
    let qCount2 = 0
    const user = Meteor.user()
    const scrollToFirst = () => this.scrollTo(qlist[0])
    return (
      <div className='container ql-quiz-session'>
        <div className='row'>
          <div className='col-md-2'>
            <div className='ql-quiz-session-qnav'>
              <div className='ql-quiz-session-qnav-title'> Questions </div>
              { qlist.map( (qid) => {
                  qCount +=1
                  let className='ql-quiz-session-questionPad'
                  const click = () => this.scrollTo(qid)
                  const responses = _.where(this.props.myResponses, { questionId: qid })
                  let response =  responses.length >0 ? _.max(responses, (resp) => { return resp.attempt }) : undefined

                  if (response) className += ' green'
                  else className +=' red'

                  return (
                    <div className={className} key={"qnav"+qid} onClick={click}> {qCount}</div>
                  )
                })
              }
            </div>
          </div>
          <div className='col-md-10'>
            <div className='ql-quiz-session-questions'>
              { qlist.map( (qid) => {

                  qCount2 += 1
                  const q = this.props.questions[qid]
                  if (!q || !q.sessionOptions) return <div className='ql-subs-loading'>Loading</div>

                  const responses = _.where(this.props.myResponses, { questionId: qid })
                  let response =  responses.length >0 ? _.max(responses, (resp) => { return resp.attempt }) : undefined
                  //response = responses.length >0 && response ? response : undefined

                  const questionDisplay = user.isInstructor(session.courseId)
                    ? <QuestionDisplay question={q} readOnly />
                    : <QuestionDisplay
                        question={q}
                        response={response}
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
            </div>
          </div>
        </div>

      </div>
    )
  }

}

export const QuizSession = createContainer((props) => {
  const handle = Meteor.subscribe('sessions.single', props.sessionId) &&
    Meteor.subscribe('questions.inSession', props.sessionId)
    Meteor.subscribe('responses.forSession', props.sessionId)

  const session = Sessions.findOne({ _id: props.sessionId })
  const questionsInSession = session ? Questions.find({_id: { $in: session.questions }}).fetch() : []
  // The user's responses
  const allMyResponses = session ? Responses.find({ questionId: { $in: session.questions }, studentUserId: Meteor.userId() }).fetch() : []
  // calculate the statistics for each question (only if not in a quiz):

  return {
    questions: _.indexBy(questionsInSession, '_id'), // question map
    session: session, // session object
    myResponses: allMyResponses, // responses related to this session
    loading: !handle.ready()
  }
}, _QuizSession)
