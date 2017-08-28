/* global FS */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// users.js: methods and publications to supplement the meteor accounts collection Meteor.users

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
  isInstructor: function (courseId) {
    check(courseId, Helpers.NEString)
    const c = Courses.findOne(courseId)
    return c ? _.contains(c.instructors, this._id) : false
  },
  hasGreaterRole: function (role) {
    if (this.profile.roles.indexOf(role) !== -1) return true
    else if (role === ROLES.prof && this.profile.roles.indexOf(ROLES.admin) !== -1) return true
    else return false
  },
  getImageUrl: function () {
    return this.profile.profileImage ? this.profile.profileImage + '/image' : '/images/avatar.png'
  },

  getThumbnailUrl: function () {
    return this.profile.profileImage ? this.profile.profileImage + '/thumbnail' : '/images/avatar.png'
  }
})

Meteor.users._transform = function (user) {
  return new User(user)
}

Meteor.users.deny({
  insert () { return true },
  update () { return true },
  remove () { return true }
})

if (Meteor.isServer) {
  Meteor.publish('userData', function () {
    if (this.userId) return Meteor.users.find({ _id: this.userId })
    else this.ready()
  })

  Meteor.publish('users.myStudents', function (params) {
    if (!this.userId) return this.ready()
    const user = Meteor.users.findOne({ _id: this.userId })

    if (user && (user.hasGreaterRole(ROLES.prof))) {
      let studentRefs = []
      Courses.find({ instructors: user._id }).fetch().forEach((c) => {
        studentRefs = studentRefs.concat(c.students || [])
      })
      return Meteor.users.find({_id: {$in: studentRefs}}, {fields: {services: false}})
    } else if (params && user.isInstructor(params.cId)) {
      let studentRefs = []
      Courses.find({_id: params.cId}).fetch().forEach((c) => {
        studentRefs = studentRefs.concat(c.students || [])
      })
      return Meteor.users.find({_id: {$in: studentRefs}}, {fields: {services: false}})
    } else return this.ready()
  })

  Meteor.publish('users.myTAs', function (params) {
    if (!this.userId) return this.ready()
    const user = Meteor.users.findOne({ _id: this.userId })
    if (user && (user.hasGreaterRole(ROLES.prof))) {
      let TARefs = []
      Courses.find({ instructors: user._id }).fetch().forEach((c) => {
        TARefs = TARefs.concat(c.instructors || [])
      })
      return Meteor.users.find({_id: {$in: TARefs}}, {fields: {services: false}})
    } else if (params && user.isInstructor(params.cId)) {
      let TARefs = []
      Courses.find({_id: params.cId}).fetch().forEach((c) => {
        TARefs = TARefs.concat(c.instructors || [])
      })
      return Meteor.users.find({_id: {$in: TARefs}}, {fields: {services: false}})
    } else return this.ready()
  })

  Meteor.publish('users.all', function () {
    if (!this.userId) return this.ready()
    const user = Meteor.users.findOne({ _id: this.userId })

    if (user && user.hasGreaterRole(ROLES.admin)) {
      return Meteor.users.find()
    } else return this.ready()
  })
}

/**
 * Meteor methods for responses object
 * @module users
 */
Meteor.methods({

  /**
   * send verification email
   */
  'users.sendVerificationEmail' () {
    let userId = Meteor.userId()
    if (userId && Meteor.isServer) {
      return Accounts.sendVerificationEmail(userId)
    }
  },

  /**
   * update profile image with new image in S3 collection
   * @param {String} profileImageUrl
   */
  'users.updateProfileImage' (profileImageUrl) {
    return Meteor.users.update({ _id: Meteor.userId() }, {
      '$set': { 'profile.profileImage': profileImageUrl }
    })
  },

  /**
   * change to new email
   * @param {String} newEmail
   */
  'users.changeEmail' (newEmail) {
    Meteor.users.update({ _id: Meteor.userId() }, {
      '$set': { 'emails': [ { address: newEmail, verified: false } ] }
    })
    return Meteor.call('users.sendVerificationEmail')
  },

  'users.verifyEmail' (email) {
    const user = Meteor.users.findOne({ _id: Meteor.userId() })
    if (user.hasRole(ROLES.admin)) {
      let emailUser = Meteor.users.findOne({'emails.address': email})
      if (!emailUser) throw new Meteor.Error('Couldn\'t find user')
      return Meteor.users.update({_id: emailUser._id}, {'$set': {'emails.0.verified': true}})
    }
  },

  /**
   * change user role
   * @param {MongoId} uId
   * @param {String} newRole
   */
  'users.changeRole' (uId, newRole) {
    check(uId, Helpers.MongoID)
    check(newRole, Helpers.NEString)
    if (!Meteor.user().hasRole(ROLES.admin)) throw new Meteor.Error('invalid-permissions', 'Invalid permissions')
    if (newRole === ROLES.admin) {
      let courses = []
      Courses.update({}, {$addToSet: {instructors: uId}}, {multi: true})
      courses = _.pluck(Courses.find().fetch(), '_id')
      return Meteor.users.update({ _id: uId }, {
        '$set': { 'profile.roles': [ newRole ],
          'courses': courses }
      })
    }
    return Meteor.users.update({ _id: uId }, {
      '$set': { 'profile.roles': [ newRole ] } // system only supports users having one role at a time
    })
  },

  /**
   * find user by email and call user.changeRole
   * @param {String} email
   * @param {String} newRole
   */
  'users.changeRoleByEmail' (email, newRole) {
    check(email, Helpers.Email)
    if (!Meteor.user().hasRole(ROLES.admin)) throw new Meteor.Error('invalid-permissions', 'Invalid permissions')
    const user = Meteor.users.findOne({ 'emails.0.address': email })
    if (!user) throw new Meteor.Error('user-not-found', 'User not found')
    return Meteor.call('users.changeRole', user._id, newRole)
  },

  /**
   * allow profs to promote a student account to prof
   * @param {String} email
   */
  'users.promote' (email) {
    check(email, Helpers.Email)
    if (!Meteor.user().hasGreaterRole(ROLES.prof)) throw new Meteor.Error('invalid-permissions', 'Invalid permissions')
    const user = Meteor.users.findOne({ 'emails.0.address': email })
    if (!user) throw new Meteor.Error('user-not-found', 'User not found')

    return Meteor.users.update({ _id: user._id }, {
      '$set': { 'profile.roles': [ ROLES.prof ] }
    })
  },

  'users.count' () {
    return Meteor.users.find().count()
  },

  'users.createFromAdmin' (user) {
    if (!Meteor.user().hasGreaterRole(ROLES.admin)) throw new Meteor.Error('invalid-permissions', 'Invalid permissions')
    return Accounts.createUser(user)
  }

})
