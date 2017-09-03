// QLICKER
// Author: Ryan Martin (ryanmartinneutrino@gmail.com)
//
// ProfileViewModal

import React, { PropTypes } from 'react'

import { ControlledForm } from '../ControlledForm'

/**
 * modal dialog to prompt for new email addresss
 * @augments ControlledForm
 * @prop {Func} done - done callback
 */
export class ProfileViewModal extends ControlledForm {

  constructor (props) {
    super(props)
    this.state = { newEmail: '' }
  }

  /**
   * done(Event: e)
   * Overrided done handler
   */
  done (e) {
    this.setState({})
    this.props.done()
  }

  render () {

    return ( this.props.user ?
      <div className='ql-modal-container' onClick={this.done}>
        <div className='row'>
          <div className='col-md-4' />
          <div className='col-md-4'>
            <div className='ql-profile-card  ql-card' onClick={this.preventPropagation}>
               <div className='profile-header ql-header-bar'><h3>{this.props.user.profile.lastname}, {this.props.user.profile.firstname}  </h3></div>
               <div className='ql-card-content'>
                  <div className='ql-profile-image-container'>
                    <img className="img-responsive" src={this.props.user.getImageUrl() } />
                 </div>
                 <div className='btn-group btn-group-justified' role='group' aria-label='...'>
                    <a className='btn btn-default' onClick={this.done}>Close</a>
                 </div>
               </div>
            </div>
        </div>
        <div className='col-md-4' />
      </div>
    </div>: 'Loading')
  } //  end render

} // end profileViewModal



ProfileViewModal.propTypes = {
  done: PropTypes.func,
  user: PropTypes.object
}
