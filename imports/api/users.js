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

const User = function (doc) { _.extend(this, doc) }
_.extend(User.prototype, {
  getName: function () {
    return this.profile.lastname + ', ' + this.profile.firstname
  },
  getEmail: function () {
    return this.emails[0].address
  },
  hasRole: function (role) {
    return this.profile.roles.indexOf(role) !== -1
  },
  hasGreaterRole: function (role) {
    if (this.profile.roles.indexOf(role) !== -1) return true
    else if (role === 'professor' && this.profile.roles.indexOf('admin') !== -1) return true
    else return false
  }
})

Meteor.users._transform = function (user) {
  return new User(user)
}

if (Meteor.isServer) {
  Meteor.publish('userData', function () {
    const user = Meteor.users.findOne({ _id: this.userId })

    if (user && user.hasGreaterRole('professor')) {
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

