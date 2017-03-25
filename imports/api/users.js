/* global FS */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// users.js: JS related to user collection

import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'

import { ROLES } from '../configs'
import Helpers from './helpers'

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
  getRole: function (role) {
    return this.profile.roles[0]
  },
  hasRole: function (role) {
    return this.profile.roles.indexOf(role) !== -1
  },
  hasGreaterRole: function (role) {
    if (this.profile.roles.indexOf(role) !== -1) return true
    else if (role === ROLES.prof && this.profile.roles.indexOf(ROLES.admin) !== -1) return true
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

    if (user && user.hasGreaterRole(ROLES.admin)) {
      return Meteor.users.find()
    } else if (user && user.hasGreaterRole(ROLES.prof)) {
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
  },


  /**
   * users.changeRole(MongoId (String) uId, String newRole)
   * change user role
   */
  'users.changeRole' (uId, newRole) {
    check(uId, Helpers.MongoID)
    check(newRole, Helpers.NEString)
    if (!Meteor.user().hasRole(ROLES.admin)) throw new Meteor.Error('invalid-permissions', 'Invalid permissions')
    return Meteor.users.update({ _id: uId }, {
      '$set': { 'profile.roles': [ newRole ] } // system only supports users having one role at a time
    })
  },

  /**
   * users.changeRoleByEmail(String email, String newRole)
   * find user by email and call user.changeRole
   */
  'users.changeRoleByEmail' (email, newRole) {
    check(email, Helpers.Email)
    if (!Meteor.user().hasRole(ROLES.admin)) throw new Meteor.Error('invalid-permissions', 'Invalid permissions')
    const user = Meteor.users.findOne({ 'emails.0.address': email })
    if (!user) throw new Meteor.Error('user-not-found', 'User not found')
    return Meteor.call('users.changeRole', user._id, newRole)
  }


})
