/* global FS */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// users.js: JS related to user collection

import { Meteor } from 'meteor/meteor'

/*
 * profile: {
 *  firstname: '',
 *  lastname: '',
 *  profileImage: '',
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
  },
  getImageUrl: function () {
    return this.profile.profileImage
      ? '/cfs/files/profile_images/' + this.profile.profileImage
      : '/images/avatar.png'
  }
})

Meteor.users._transform = function (user) {
  return new User(user)
}

var imageStore = new FS.Store.GridFS('profile_images')

export const ProfileImages = new FS.Collection('profile_images', {
  stores: [imageStore]
})
// Images publishing
if (Meteor.isServer) {
  Meteor.publish('profile_images', function () { return ProfileImages.find() })
}
ProfileImages.deny({ insert: () => false, update: () => false, remove: () => false, download: () => false })
ProfileImages.allow({ insert: () => true, update: () => true, remove: () => true, download: () => true })

if (Meteor.isServer) {
  Meteor.publish('userData', function () {
    const user = Meteor.users.findOne({ _id: this.userId })

    if (user && user.hasGreaterRole('professor')) {
      let studentRefs = []
      Courses.find({ owner: user._id }).fetch().forEach((c) => {
        studentRefs = studentRefs.concat(c.students || [])
      })
      return Meteor.users.find({ _id: { $in: studentRefs } }, { fields: { services: false } })
    } else if (user._id) {
      return Meteor.users.find({_id: this.userId})
    } else {
      this.ready()
    }
  })
}

// data methods
Meteor.methods({

  /**
   * users.sendVerificationEmail()
   * send verification email
   */
  'users.sendVerificationEmail' () {
    let userId = Meteor.userId()
    if (userId) {
      return Accounts.sendVerificationEmail(userId)
    }
  },

  /**
   * users.updateProfileImage(MongoId (string) profileImageId)
   * update profile image with new image in ProfileImages collection
   */
  'users.updateProfileImage' (profileImageId) {
    return Meteor.users.update({ _id: Meteor.userId() }, {
      '$set': { 'profile.profileImage': profileImageId }
    })
  },

  /**
   * users.changeEmail(String newEmail)
   * change to new email
   */
  'users.changeEmail' (newEmail) {
    Meteor.users.update({ _id: Meteor.userId() }, {
      '$set': { 'emails': [ { address: newEmail, verified: false } ] }
    })
    return Meteor.call('users.sendVerificationEmail')
  }

})
