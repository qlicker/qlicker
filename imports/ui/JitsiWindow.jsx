import React, { Component } from 'react'
import PropTypes from 'prop-types';

export class JitsiWindow extends Component {
  constructor (props) {
    super(props)

    this.state = {
        api:null,
        directLink:null
      }

    this.toggleHelpButton = this.toggleHelpButton.bind(this)
  }
  toggleHelpButton (courseId, catNumber, groupNumber) {
    Meteor.call('courses.toggleGroupHelpVideoChat', courseId, catNumber, groupNumber, (err) => {
      if (err) {
        alertify.error('Error: ' + err.error)
      } else {
        alertify.success('Help button toggled')
      }
    })
  }
  clearRoom (courseId, catNumber, groupNumber) {
    Meteor.call('courses.clearGroupRoom', courseId, catNumber, groupNumber, (err) => {
      if (err) {
        alertify.error('Error: ' + err.error)
      } else {
        alertify.success('Room cleared of participants')
      }
    })
  }
  componentDidMount() {
    if (!this.props.connectionInfo) {
      alertify.error('Error: no connection info  on mount')
    }

    Meteor.call('settings.getJitsiDomain',  (err,result) => {
      //This seemed like the best way to run the server side method to get the domain name from the settings.
      if(!err){ //only once the domain is known, can the API be initialized...
        const apiOptions = this.props.connectionInfo.apiOptions
        let options = this.props.connectionInfo.options
        let courseId = this.props.connectionInfo.courseId
        let categoryNumber = this.props.connectionInfo.categoryNumber
        let groupNumber = this.props.connectionInfo.groupNumber

        const domain = result.domain

        options.configOverwrite.startWithAudioMuted = apiOptions.startAudioMuted
        options.configOverwrite.startWithVideoMuted = apiOptions.startVideoMuted

        //Check if an etherpad/whiteboard domain exists
        //In principle, can pass an options as etherpad_base, but doesn't always work
        const etherpadDomain = apiOptions.useWhiteboard && result.whiteboard
          ? result.whiteboard
          : (result.etherpad ? result.etherpad : '')

        if(etherpadDomain){
          options.etherpad_base = etherpadDomain
        }

        //has to be set here, only exists once mounted
        options.parentNode = document.getElementById('ql-jitsi-inner')

        const  api = (typeof JitsiMeetExternalAPI === 'function')
                      ? new JitsiMeetExternalAPI(domain, options)
                      : null

        //const api = new JitsiMeetExternalAPI(domain, options)
        const directLink = domain ? 'https://'+domain+'/'+options.roomName: null
        this.setState({api:api, directLink:directLink})

        const joinCall = () =>{
          if(courseId){
            if(categoryNumber && groupNumber){
              Meteor.call('courses.joinCategoryVideoChat',courseId, categoryNumber, Number(groupNumber))
            } else {
              Meteor.call('courses.joinVideoChat',courseId)
            }
          }
          return null
        }

        const leaveCall = () =>{
          if(courseId){
            if(categoryNumber && groupNumber){
              Meteor.call('courses.leaveCategoryVideoChat',courseId, categoryNumber,  Number(groupNumber))
            } else {
              Meteor.call('courses.leaveVideoChat',courseId)
            }
          }
          return null
        }

        const closeWindow = () => {
          leaveCall()
          this.state.api.dispose()
          window.close()
        }

        if (api){
          //Close the window on hangup
          api.addListener('videoConferenceJoined', joinCall)
          api.addListener('videoConferenceLeft', leaveCall)
          api.addListener('videoConferenceLeft', closeWindow)
          //window.onbeforeunload = leaveCall //also leave call if window is closed
          window.addEventListener("beforeunload", leaveCall); //same
          //window.addEventListener("unload", leaveCall); //same

          if(apiOptions.subjectTitle){
            api.executeCommand('subject', apiOptions.subjectTitle);
          }
          //Use Qlicker avatar:
          api.executeCommand('avatarUrl',  Meteor.user().getImageUrl())
          //Mute audio on join
          if (apiOptions.startAudioMuted){
            api.isAudioMuted().then(muted => {
              if(!muted) api.executeCommand('toggleAudio');
            });
          }
          if (apiOptions.startVideoMuted){
            //redundant with the option set in configOverwrite:
            api.isVideoMuted().then(muted => {
              if(!muted) api.executeCommand('toggleVideo');
            });
          }

          //tile view toggle is set as a cookie, so need to check each time, for both true and false...
          //https://github.com/jitsi/jitsi-meet/issues/5764 - should eventually be able to do with settings
          if (apiOptions.startTileView){
            api.addListener('videoConferenceJoined', () => {
              const listener = ({ enabled }) => {
                if (!enabled) {
                  api.executeCommand('toggleTileView');
                }
                api.removeListener('tileViewChanged', listener); //remove so this only gets called once!
              };
              api.addEventListener('tileViewChanged', listener);
              api.executeCommand('toggleTileView'); //triggers the listener, which will toggle back to tileView if appropriate!
            });
          }
          if (apiOptions.startTileView == false){ //set
            api.addListener('videoConferenceJoined', () => {
              const listener = ({ enabled }) => {
                if (enabled) {
                  api.executeCommand('toggleTileView');
                }
                api.removeListener('tileViewChanged', listener); //remove so this only gets called once!
              };
              api.addEventListener('tileViewChanged', listener);
              api.executeCommand('toggleTileView'); //triggers the listener, which will toggle back to tileView if appropriate!
            });
          }
        }//end if api
      }//end if not err in Meteor method
    })//end Meteor method call
  }

  render () {

    if (!this.props.connectionInfo) return <div className='ql-subs-loading'>No connection info</div>

    let categoryNumber = this.props.connectionInfo.categoryNumber ? Number(this.props.connectionInfo.categoryNumber) : -1
    let groupNumber = this.props.connectionInfo.groupNumber ? Number(this.props.connectionInfo.groupNumber) : -1
    let courseId = this.props.connectionInfo.courseId
    let help = this.props.connectionInfo.helpVideoChat
    const user = Meteor.user()
    let callButton = categoryNumber && groupNumber && courseId && user.isStudent(courseId)
    const isInstructor = user.isInstructor(courseId)
    const toggleHelp = callButton ? () =>{this.toggleHelpButton(courseId, categoryNumber, groupNumber)} : null
    const clearRoom = isInstructor ? () =>{this.clearRoom(courseId, categoryNumber, groupNumber)} : null
    let extraClass = help ? ' ql-blinking' : ''

    return(
      <div className='ql-jitsi-outer' >

        <div className='ql-jitsi-inner' id='ql-jitsi-inner' />
        <div className='ql-jitsi-toolbar'>
          <div className='ql-jitsi-toolbar-info'>
            Chat room direct link: <a href={this.state.directLink}> {this.state.directLink} </a>
          </div>
          { callButton
            ? <div className={'btn'+extraClass} onClick={toggleHelp}>
                {help ? 'Calling instructor... ':'Call instructor for help '}
              </div>
            : ''
          }
          { isInstructor
            ? <div className={'btn'+extraClass} onClick={clearRoom}>
                Clear room of participants
              </div>
            : ''
           }
        </div>
      </div>
    )
  }

}


JitsiWindow.propTypes = {
  connectionInfo: PropTypes.object.isRequired,
  setApi: PropTypes.func
}
