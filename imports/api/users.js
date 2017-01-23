// QLICKER
// Author: Enoch T <me@enocht.am>
//
// users.js: JS related to user collection

import { Meteor } from 'meteor/meteor'

/*
 * profile: {
 *  firstname: '',
 *  lastname: '',
 *  roles: ['student', 'professor', 'admin']
 * }
 */

Meteor.userHasRole = function (user, role) {
  return user && user.profile.roles.indexOf(role) !== -1
}

Meteor.userRoleGreater = function (user, role) {
  if (!user) return false
  else if (user.profile.roles.indexOf(role) !== -1) return true
  else if (role === 'professor' && user.profile.roles.indexOf('admin') !== -1) return true
  else return false
  // TODO generalize this
}

if (Meteor.isServer) {
  Meteor.publish('userData', function () {
    if (this.userId) {
      return Meteor.users.find({_id: this.userId})
    } else {
      this.ready()
    }
  })
}

Meteor.methods({

  'user.hasRole' (user, role) {
    return Meteor.userHasRole(user, role)
  },

  'user.roleGreater' (user, role) {
    return Meteor.userRoleGreater(user, role)
  }

})

