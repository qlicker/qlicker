
import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data'

import '../api/users.js'

export class ProfileCard extends Component {  

  constructor(props) {
    super(props)
    

  }


  render() {
    let r
    if (this.props.loading) r = <div>hello</div>
    else {
      console.log(this.props.user, this.props.loading)
     
      r = (<div className='ui-profile-card'>
        User Id: {this.props.user[0]._id || ''}<br/>
        Email: {this.props.user[0].emails[0].address || ''}
      </div>)
    }

    return r
  } //  end render

}

//ProfileCard.propTypes = {
//  user: PropTypes.object.isRequired,
//};

export default createContainer(() => {
  const sub = Meteor.subscribe('userData');
  
  return {
    user: Meteor.users.find({ _id: Meteor.userId() }).fetch(),
    loading: !sub.ready()
  };
}, ProfileCard);
