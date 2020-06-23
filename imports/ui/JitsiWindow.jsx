import React, { Component } from 'react'
import PropTypes from 'prop-types';



export class JitsiWindow extends Component {
  constructor (props) {
    super(props)

    this.state = {

    }

  }

  componentDidMount() {
    const domain = 'meet.qlicker.org';
    const options = {
     roomName: 'qlicker-jitsi-1',
     width: 500,
     height:500,
     parentNode: document.getElementById('jitsi-inner'),
     interfaceConfigOverwrite: {
      filmStripOnly: false,
      SHOW_JITSI_WATERMARK: false,
     },
     configOverwrite: {
      disableSimulcast: false,
     },
    };
    const api = new JitsiMeetExternalAPI(domain, options);
  }

  render () {
    return(
      <div className='jitsi-outer'>
        <div id='jitsi-inner' />
      </div>
    )
  }

}


JitsiWindow.propTypes = {

}
