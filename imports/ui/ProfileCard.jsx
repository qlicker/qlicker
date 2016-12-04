
import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'

import '../api/users.js'

export class ProfileCard extends Component {

  constructor(props) {
    super(props)
    this.user = this.props.user[0]
  }

  render() {
    let r
    if (this.props.loading) r = <div>loading</div>
    else {
      console.log(this.props.user, this.props.loading)

      r = (<div className='ui-profile-card'>
        <h3>User Account Information</h3>
        Name: { this.user.profile.firstname + ' ' + this.user.profile.lastname }<br/>
        Email: { this.user.emails[0].address }<br/>
        Roles: { this.user.profile.roles }
      </div>)
    }

    return r
  } //  end render

}

//ProfileCard.propTypes = {
//  user: PropTypes.object.isRequired,
//};

export default createContainer(() => {
  const sub = Meteor.subscribe('userData')

  return {
    user: Meteor.users.find({ _id: Meteor.userId() }).fetch(),
    loading: !sub.ready()
  }
}, ProfileCard);
