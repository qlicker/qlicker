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
import { CheckBoxOption, CleanTooltip } from './CleanForm'

import { ROLES } from '../configs'


export class _VideoChat extends Component {

  constructor (props) {
    super(props)

    this.state = {
    }

    this.toggleCourseVideoChat = this.toggleCourseVideoChat.bind(this)
    this.toggleCategoryVideoChat = this.toggleCategoryVideoChat.bind(this)
  //  this.toggleCourseWhiteboard = this.toggleCourseWhiteboard.bind(this)
    this.toggleCourseTileView = this.toggleCourseTileView.bind(this)
    this.toggleCategoryTileView = this.toggleCategoryTileView.bind(this)
    this.toggleCourseStartVideo = this.toggleCourseStartVideo.bind(this)
    this.toggleCourseStartAudio= this.toggleCourseStartAudio.bind(this)
    this.toggleCategoryStartVideo = this.toggleCategoryStartVideo.bind(this)
    this.toggleCategoryStartAudio= this.toggleCategoryStartAudio.bind(this)
    this.clearCategoryRooms = this.clearCategoryRooms.bind(this)
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


  toggleCourseStartVideo(courseId) {
    let hasApiOptions = this.props.course && this.props.course.videoChatOptions && this.props.course.videoChatOptions.apiOptions
    if (hasApiOptions){
      let apiOptions = this.props.course.videoChatOptions.apiOptions
      apiOptions.startVideoMuted = !apiOptions.startVideoMuted
      Meteor.call('courses.setApiOptions', courseId, apiOptions, (err) => {
        if (err) {
          alertify.error('Error: ' + err.error)
        } else {
          alertify.success('Updated')
        }
      })
    } else {
      alertify.error('Error: no video options')
    }
  }

  toggleCourseStartAudio(courseId) {
    let hasApiOptions = this.props.course && this.props.course.videoChatOptions && this.props.course.videoChatOptions.apiOptions
    if (hasApiOptions){
      let apiOptions = this.props.course.videoChatOptions.apiOptions
      apiOptions.startAudioMuted = !apiOptions.startAudioMuted
      Meteor.call('courses.setApiOptions', courseId, apiOptions, (err) => {
        if (err) {
          alertify.error('Error: ' + err.error)
        } else {
          alertify.success('Updated')
        }
      })
    } else {
      alertify.error('Error: no video options')
    }
  }

  toggleCourseTileView(courseId) {
    let hasApiOptions = this.props.course && this.props.course.videoChatOptions && this.props.course.videoChatOptions.apiOptions
    if (hasApiOptions){
      let apiOptions = this.props.course.videoChatOptions.apiOptions
      apiOptions.startTileView = !apiOptions.startTileView
      Meteor.call('courses.setApiOptions', courseId, apiOptions, (err) => {
        if (err) {
          alertify.error('Error: ' + err.error)
        } else {
          alertify.success('Updated')
        }
      })
    } else {
      alertify.error('Error: no video options')
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

  toggleCategoryTileView(courseId, category) {
    let hasApiOptions = category.catVideoChatOptions && category.catVideoChatOptions.apiOptions
    if (hasApiOptions){
      let apiOptions = category.catVideoChatOptions.apiOptions
      apiOptions.startTileView = !apiOptions.startTileView
      Meteor.call('courses.setCategoryApiOptions', courseId, category.categoryNumber, apiOptions, (err) => {
        if (err) {
          alertify.error('Error: ' + err.error)
        } else {
          alertify.success('Updated')
        }
      })
    } else {
      alertify.error('Error: no video options')
    }
  }

  toggleCategoryStartAudio(courseId, category) {
    let hasApiOptions = category.catVideoChatOptions && category.catVideoChatOptions.apiOptions
    if (hasApiOptions){
      let apiOptions = category.catVideoChatOptions.apiOptions
      apiOptions.startAudioMuted = !apiOptions.startAudioMuted
      Meteor.call('courses.setCategoryApiOptions', courseId, category.categoryNumber, apiOptions, (err) => {
        if (err) {
          alertify.error('Error: ' + err.error)
        } else {
          alertify.success('Updated')
        }
      })
    } else {
      alertify.error('Error: no video options')
    }
  }


  toggleCategoryStartVideo(courseId, category) {
    let hasApiOptions = category.catVideoChatOptions && category.catVideoChatOptions.apiOptions
    if (hasApiOptions){
      let apiOptions = category.catVideoChatOptions.apiOptions
      apiOptions.startVideoMuted = !apiOptions.startVideoMuted
      Meteor.call('courses.setCategoryApiOptions', courseId, category.categoryNumber, apiOptions, (err) => {
        if (err) {
          alertify.error('Error: ' + err.error)
        } else {
          alertify.success('Updated')
        }
      })
    } else {
      alertify.error('Error: no video options')
    }
  }

  clearCategoryRooms(courseId, category) {
    Meteor.call('courses.clearCategoryRooms', courseId, category.categoryNumber, (err) => {
      if (err) {
        alertify.error('Error: ' + err.error)
      } else {
        alertify.success('Room counters cleared')
      }
    })
  }


  render () {
    if (this.props.loading || !this.props.course) return <div className='ql-subs-loading'>Loading</div>

    const isInstructor = Meteor.user().isInstructor(this.props.courseId)
    //Course-wide options abd functions
    const courseVideoChatEnabled = !!this.props.course.videoChatOptions
    const courseApiOptions = courseVideoChatEnabled && this.props.course.videoChatOptions.apiOptions
    //const courseWhiteboardEnabled = courseApiOptions && !!courseApiOptions.useWhiteboard
    const courseTileView = courseApiOptions && !!courseApiOptions.startTileView
    const courseAudioMuted = courseApiOptions && !!courseApiOptions.startAudioMuted
    const courseVideoMuted = courseApiOptions && !!courseApiOptions.startVideoMuted

    const toggleCourseVideoChat = () => this.toggleCourseVideoChat(this.props.course._id, courseVideoChatEnabled)
    //const toggleCourseWhiteboard = () => this.toggleCourseWhiteboard(this.props.course._id)
    const toggleCourseStartVideo = () => this.toggleCourseStartVideo(this.props.course._id)
    const toggleCourseStartAudio = () => this.toggleCourseStartAudio(this.props.course._id)
    const toggleCourseTileView = () => this.toggleCourseTileView(this.props.course._id)
    //The link that opens the whole course video chat
    const courseChatWindow = () => { window.open('/course/'+this.props.courseId+'/videochatwindow', 'Qlicker Video Chat', 'height=768,width=1024') }

    const groupCategories = this.props.course.groupCategories ? this.props.course.groupCategories : []
    const categoriesWithChatEnabled =  _(groupCategories).filter( (cat) => {return !!cat.catVideoChatOptions} )

    const studentsInCourseVideoChat = isInstructor && courseVideoChatEnabled && this.props.course.videoChatOptions.joined
                      ? Meteor.users.find({ _id: { $in: this.props.course.videoChatOptions.joined || [] } }, { sort: { 'profile.lastname': 1 } }).fetch()
                      : []
    const nStudentsInCourseVideoChat = studentsInCourseVideoChat ? studentsInCourseVideoChat.length : 0
    const courseStudentsToolTip = studentsInCourseVideoChat.map((student) =>
      <div key={student._id}>
        <p>{student.profile.lastname + ', ' + student.profile.firstname}</p>
      </div>
    )

    //A component to display group category name and controls to enable the chat
    const VideoSessionControl = ({name, category, onClick, catTileClick, catAudioClick, catVideoClick, catVideoReset}) => {
      if (name){
        let extraClass = courseVideoChatEnabled ? 'active' : ''
        return(
          <li>
            <div className='ql-group-list-item-name'>
              {name}
            </div>
            <div className='ql-group-list-item-controls'>
              <CheckBoxOption label={'Enabled'} checked={courseVideoChatEnabled} onChange={toggleCourseVideoChat} id ={'courseChatVidToggler'} />
              { courseVideoChatEnabled
                 ? <div>
                     <CheckBoxOption label={'Mute video'} checked={courseVideoMuted} onChange={toggleCourseStartVideo} id ={'courseChatTileToggler'} />
                     <CheckBoxOption label={'Mute audio'} checked={courseAudioMuted} onChange={toggleCourseStartAudio} id ={'courseChatTileToggler'} />
                     <CheckBoxOption label={'Tile view'} checked={courseTileView} onChange={toggleCourseTileView} id ={'courseChatTileToggler'} />
                   </div>
                 : ''
              }
            </div>
          </li>
        )
      }
      if (category) {
        let extraClass = category.catVideoChatOptions ? 'active' : ''
        let catChatEnabled = !!category.catVideoChatOptions
        let chatTileEnabled = catChatEnabled && category.catVideoChatOptions.apiOptions && category.catVideoChatOptions.apiOptions.startTileView
        let muteVideoEnabled = catChatEnabled && category.catVideoChatOptions.apiOptions && category.catVideoChatOptions.apiOptions.startVideoMuted
        let muteAudioEnabled = catChatEnabled && category.catVideoChatOptions.apiOptions && category.catVideoChatOptions.apiOptions.startAudioMuted
        return(
          <li>
            <div className='ql-group-list-item-name'>
              {category.categoryName} ({category.groups.length} groups)
            </div>
            <div className='ql-group-list-item-controls'>
              <CheckBoxOption label={'Enabled'} checked={catChatEnabled} onChange={onClick} id ={'courseChatCatToggler'+category.categoryName+'N'+category.categoryNumber} />
              { catChatEnabled
                ? <div>
                    <CheckBoxOption label={'Mute video'} checked={muteVideoEnabled} onChange={catVideoClick} id ={'courseChatVideoMuteToggler'} />
                    <CheckBoxOption label={'Mute audio'} checked={muteAudioEnabled} onChange={catAudioClick} id ={'courseChatAudioMuteToggler'} />
                    <CheckBoxOption label={'Tile view'} checked={chatTileEnabled} onChange={catTileClick} id ={'courseChatCatTileToggler'+category.categoryName+'N'+category.categoryNumber} />
                    <div className='btn' onClick={catVideoReset} style={{height:'20px', padding:'0 5px 0 5px'}}>
                      Clear participants
                    </div>
                  </div>
                : ''
              }
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
                    { groupCategories.length > 0
                      ? groupCategories.map(cat => {
                        const toggleCategoryVideoChat = () => this.toggleCategoryVideoChat(this.props.course._id, !!cat.catVideoChatOptions, cat.categoryNumber)
                        const toggleCategoryTileView = () => this.toggleCategoryTileView(this.props.course._id, cat)
                        const toggleCategoryStartAudio = () => this.toggleCategoryStartAudio(this.props.course._id, cat)
                        const toggleCategoryStartVideo = () => this.toggleCategoryStartVideo(this.props.course._id, cat)
                        const clearCategoryRooms = () => this.clearCategoryRooms(this.props.course._id, cat)
                        return(
                          <VideoSessionControl category={cat}
                           onClick = {toggleCategoryVideoChat}
                           catTileClick = {toggleCategoryTileView}
                           catVideoClick = {toggleCategoryStartVideo}
                           catAudioClick = {toggleCategoryStartAudio}
                           catVideoReset = {clearCategoryRooms}
                           key={'vc'+cat.categoryNumber+cat.categoryName} />
                        )
                      })
                      : <div> Create groups in main course page! </div>
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
                ? <div className='ql-video-join'>
                    <div className='ql-video-catname'>
                     Course-wide video chat
                    </div>
                    <div className='ql-video-join-buttons'>
                      <CleanTooltip info={isInstructor && nStudentsInCourseVideoChat ? courseStudentsToolTip: null}>
                        <div className='btn' onClick={courseChatWindow}>
                          Join class-wide chat ({this.props.course.videoChatOptions.joined.length})
                        </div>
                      </CleanTooltip>
                    </div>
                  </div>
                : categoriesWithChatEnabled.length > 0
                  ? ''
                  : <div className='ql-video-catname'> No video chats enabled </div>
              }

              { categoriesWithChatEnabled.map(cat => {
                return(
                  <div className='ql-video-join' key={'vcc'+cat.categoryNumber+cat.categoryName} >
                    <div className='ql-video-catname'> {cat.categoryName} </div>
                    <div className='ql-video-join-buttons'>
                      { cat.groups.map(group => {
                          //this link is parsed in routes.jsx to ultimately create a route for JitsiWindow
                          const link = '/course/'+this.props.courseId+'/categoryvideochatwindow/'+cat.categoryNumber+'/'+group.groupNumber
                          const categoryChatWindow = () => { window.open(link, 'Video chat with '+group.groupName, 'height=768,width=1024')}
                          const nParticipants = group.joinedVideoChat ? group.joinedVideoChat.length : 0
                          let extraClass = nParticipants > 0 ? ' ql-back-light-green' : ''
                          extraClass = isInstructor && group.helpVideoChat ? ' ql-blinking' : extraClass
                          //list of students
                          const students = isInstructor && group.joinedVideoChat
                                            ? Meteor.users.find({ _id: { $in: group.joinedVideoChat || [] } }, { sort: { 'profile.lastname': 1 } }).fetch()
                                            : []
                          const studentsToolTip = students.map((student) =>
                            <div key={student._id}>
                              <p>{student.profile.lastname + ', ' + student.profile.firstname}</p>
                            </div>
                          )
                          return(
                            <CleanTooltip key={'vccgctp'+cat.categoryNumber+'gx'+group.groupNumber+group.groupName} info={isInstructor && nParticipants  ? studentsToolTip: null}>
                              <div className={'btn'+extraClass} onClick={categoryChatWindow}>
                                {'Join '+group.groupName+' ('+nParticipants+')'}
                              </div>
                            </CleanTooltip>
                          )
                        })
                      }
                    </div>
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
  const handle = Meteor.subscribe('courses.single', props.courseId) && Meteor.subscribe('users.studentsInCourse', props.courseId)
  const course = Courses.findOne(props.courseId)

  return {
    course: course,
    loading: !handle.ready()
  }
})( _VideoChat)

VideoChat.propTypes = {
  courseId: PropTypes.string
}
