import React, { Component } from 'react'
import PropTypes from 'prop-types';



export class JitsiWindow extends Component {
  constructor (props) {
    super(props)

    this.state = {
        api:null
      }

  }

  componentDidMount() {

    if(this.props.domain && this.props.options ) {
      const domain = this.props.domain
      let options = this.props.options

      options.parentNode = document.getElementById('jitsi-inner')//has to be set here
      const api = new JitsiMeetExternalAPI(domain, options)
      this.setState({api:api})
      if(this.props.setApi) this.props.setApi(api)// pass the api object to whoever created the component
    }
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
  domain: PropTypes.string.isRequired,
  options: PropTypes.object.isRequired,
  setApi: PropTypes.func,
}
