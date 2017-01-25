// QLICKER
// Author: Enoch T <me@enocht.am>
//
// users.js: JS related to user collection

import { Meteor } from 'meteor/meteor'

/*
 * profile: {
 *  firstname: '',
 *  lastname: '',
 *  roles: ['student', 'professor', 'admin'],
 *  courses: []
 * }
 */
import { Courses } from './courses'
import { _ } from 'underscore'

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
    const user = Meteor.users.findOne({ _id: this.userId })

    if (Meteor.userRoleGreater(user, 'professor')) {
      let studentRefs = []
      Courses.find({ owner: user._id }).fetch().forEach((c) => {
        studentRefs = studentRefs.concat(_(c.students || []).pluck('studentUserId'))
      })
      return Meteor.users.find({ _id: { $in: studentRefs } }, { fields: { services: false } })
    } else if (user._id) {
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

