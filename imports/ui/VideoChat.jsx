// QLICKER
// Author: Enoch T <me@enocht.am>
//
// classlist_participation.jsx: page for displaying class participation

import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { withTracker }  from 'meteor/react-meteor-data'
import _ from 'underscore'

import Select from 'react-select'
import 'react-select/dist/react-select.css'

import { Courses } from '../api/courses'
import { Sessions } from '../api/sessions'

import { JitsiWindow } from './JitsiWindow'

import { ROLES } from '../configs'


export class _VideoChat extends Component {

  constructor (props) {
    super(props)

    this.state = {

    }


    this.toggleCourseVideoChat = this.toggleCourseVideoChat.bind(this)
    this.toggleCategoryVideoChat = this.toggleCategoryVideoChat.bind(this)
  }

  toggleCourseVideoChat (courseId, enabled) {
    let question = (enabled ? 'Disable ' :'Enable ')+'video chat access for whole class?'
    let success = 'Video chat '+(enabled ? 'disabled' :'enabled')+' for whole class'
    if (confirm(question)) {
      Meteor.call('courses.toggleVideoChat', courseId, (err) => {
        if (err) {
          alertify.error('Error: ' + err.error)
        } else {
          alertify.success(success)
        }
      })
    }
  }

  toggleCategoryVideoChat (courseId, enabled, categoryNumber) {
    let question = (enabled ? 'Disable ' :'Enable ')+'video chat for group category?'
    let success = 'Video chat '+(enabled ? 'disabled' :'enabled')
    if (confirm(question)) {
      Meteor.call('courses.toggleCategoryVideoChat', courseId, categoryNumber, (err) => {
        if (err) {
          alertify.error('Error: ' + err.error)
        } else {
          alertify.success(success)
        }
      })
    }
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>
    const isInstructor = Meteor.user().isInstructor(this.props.courseId)
    //The course wide video chat:
    const courseVideoChatEnabled = !!this.props.course.videoChatOptions
    //The link that opens the whole course video chat
    const courseChatWindow = () => { window.open('/course/'+this.props.courseId+'/videochatwindow', 'Qlicker Video Chat', 'height=768,width=1024') }

    const groupCategories = this.props.course.groupCategories
    const categoriesWithChatEnabled = _(groupCategories).filter( (cat) => {return !!cat.catVideoChatOptions} )

    const toggleCourseVideoChat = () => this.toggleCourseVideoChat(this.props.course._id, courseVideoChatEnabled)
    //A component to display group category name and controls to enable the chat
    const VideoSessionControl = ({name, category, onClick}) => {
      if (name){
        let extraClass = courseVideoChatEnabled ? 'active' : ''
        return(
          <li>
            <div className='ql-group-list-item-name'>
              {name}
            </div>
            <div className='ql-group-list-item-controls'>
              <div className={'btn '+extraClass} onClick={toggleCourseVideoChat}>
                {courseVideoChatEnabled ? 'Disable' : 'Enable' }
              </div>
            </div>
          </li>
        )
      }
      if (category) {
        let extraClass = category.catVideoChatOptions ? 'active' : ''
        return(
          <li>
            <div className='ql-group-list-item-name'>
              {category.categoryName} ({category.groups.length} groups)
            </div>
            <div className='ql-group-list-item-controls'>
              <div className={'btn '+extraClass} onClick={onClick}>
                {category.catVideoChatOptions ? 'Disable' : 'Enable' }
              </div>
            </div>
          </li>
        )
      }
    }

    return (
      <div className='ql-video-page'>
        { isInstructor
          ? <div className='ql-video-page-controls'>
              <div className='ql-card'>
                <div className='ql-header-bar'>
                  <h4>Enable/Disable Chat Rooms</h4>
                </div>

                <div className='ql-card-content'>
                  <ul>
                    <VideoSessionControl name={'Course-wide video chat'} onClick={toggleCourseVideoChat} />
                    { groupCategories.map(cat => {
                        const toggleCategoryVideoChat = () => this.toggleCategoryVideoChat(this.props.course._id, !!cat.catVideoChatOptions, cat.categoryNumber)
                        return(
                          <VideoSessionControl category={cat} onClick = {toggleCategoryVideoChat} key={'vc'+cat.categoryNumber+cat.categoryName} />
                        )
                      })
                    }
                  </ul>
                </div>
              </div>
            </div>
          : ''
        }
        <div className='ql-video-page-rooms'>
          <div className='ql-card'>
            <div className='ql-header-bar'>
              <h4>Join chat room</h4>
            </div>

            <div className='ql-card-content'>
              { courseVideoChatEnabled
                ? <div>
                    <div className='ql-video-catname'>
                     Course-wide video chat
                    </div>
                    <div className='btn' onClick={courseChatWindow}>
                      Join class-wide chat
                    </div>
                  </div>
                : categoriesWithChatEnabled.length > 0
                  ? ''
                  : <div className='ql-video-catname'> No video chats enabled </div>
              }

              { categoriesWithChatEnabled.map(cat => {
                return(
                  <div key={'vcc'+cat.categoryNumber+cat.categoryName} >
                    <div className='ql-video-catname'> {cat.categoryName} </div>
                      { cat.groups.map(group => {
                          //this link is parsed in routes.jsx to ultimately create a route for JitsiWindow
                          const link = '/course/'+this.props.courseId+'/categoryvideochatwindow/'+cat.categoryNumber+'/'+group.groupNumber
                          const categoryChatWindow = () => { window.open(link, 'Video chat with '+group.groupName, 'height=768,width=1024')}

                          return(
                            <div className='btn' onClick={categoryChatWindow} key={'vccg'+cat.categoryNumber+'gx'+group.groupNumber+group.groupName}>
                              {'Join '+group.groupName}
                            </div>
                          )
                        })
                      }
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

export const VideoChat = withTracker((props) => {
  const handle = Meteor.subscribe('courses.single', props.courseId)
  const course = Courses.findOne(props.courseId)
  console.log(course)
  return {
    course: course,
    loading: !handle.ready()
  }
})( _VideoChat)

VideoChat.propTypes = {
  courseId: PropTypes.string
}
