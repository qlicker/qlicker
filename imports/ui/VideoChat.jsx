// QLICKER
// Author: Enoch T <me@enocht.am>
//
// classlist_participation.jsx: page for displaying class participation

import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { withTracker }  from 'meteor/react-meteor-data'

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
    //this.toggleCategoryVideoChat = this.toggleCategoryVideoChat.bind(this)
  }

  toggleCourseVideoChat (courseId, enabled) {
    let question = (enabled ? 'Disable ' :'Enable ')+'video chat access for whole class?'
    let success = 'Video chat '+(enabled ? 'disabled' :'enabled')
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

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    let domain = 'meet.qlicker.org'

    let vId = 123456543321
    const openChatWindow = () => { window.open('/course/'+this.props.courseId+'/videochatwindow/' +vId, 'Qlicker Video Chat', 'height=768,width=1024') }

    /*
    <div type='button' className='btn btn-secondary' onClick={openChatWindow}>
      Open video chat window
    </div>
    */

    const groupCategories = this.props.course.groupCategories

    const categoriesWithChatEnabled = groupCategories //TODO select only with those enabled, and those selected in drop down
    const courseVideoChatEnabled = this.props.course.videoChatEnabled
    const toggleCourseVideoChat = () => this.toggleCourseVideoChat(this.props.course._id, this.props.course.videoChatEnabled)
    //A component to display group category name and controls to enable the chat
    const VideoSessionControl = ({name, category, onClick}) => {
      if (name){
        return(
          <li>
            <div className='ql-group-list-item-name'>
              {name}
            </div>
            <div className='ql-group-list-item-controls'>
              <div className='btn' onClick={onClick}>
                {courseVideoChatEnabled ? 'Disable' : 'Enable' }
              </div>
            </div>
          </li>
        )
      }
      if (category) {
        return(
          <li>
            <div className='ql-group-list-item-name'>
              {category.categoryName} ({category.groups.length} groups)
            </div>
            <div className='ql-group-list-item-controls'>
              <div className='btn ' onClick={onClick}>
                {category.videoChatEnabled ? 'Disable' : 'Enable' }
              </div>
            </div>
          </li>
        )
      }
    }

    return (
      <div className='ql-video-page'>

        <div className='ql-video-page-controls'>
          <div className='ql-card'>
            <div className='ql-header-bar'>
              <h4>Enable/Disable Chat Rooms</h4>
            </div>

            <div className='ql-card-content'>
              <ul>
                <VideoSessionControl name={'Entire class'} onClick={toggleCourseVideoChat} />
                { groupCategories.map(cat => {
                  return <VideoSessionControl category={cat} key={'vc'+cat.categoryCount+cat.categoryName} />
                  })
                }
              </ul>
            </div>
          </div>
        </div>

        <div className='ql-video-page-rooms'>
          <div className='ql-card'>
            <div className='ql-header-bar'>
              <h4>Join chat room</h4>
            </div>

            <div className='ql-card-content'>

              <div className='btn' onClick={openChatWindow}>
                Entire class
              </div>

              { categoriesWithChatEnabled.map(cat => {
                return(
                  <div key={'vcc'+cat.categoryCount+cat.categoryName} >
                    <div className='ql-video-catname'> {cat.categoryName} </div>
                      { cat.groups.map(group => {
                          return <div key={'vccg'+cat.categoryCount+cat.categoryName+'g'+group.groupNumber+group.groupName} className='btn' onClick={openChatWindow}> {group.groupName} </div>
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
  //const sessionFields = {_id:1, name:1, status:1, reviewable:1, date:1 }
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
