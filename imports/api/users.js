// QLICKER
// Author: Enoch T <me@enocht.am>
//
// users.js: methods and publications to supplement the meteor accounts collection Meteor.users

import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'

import { ROLES } from '../configs'
import Helpers from './helpers'

import { Settings } from './settings'

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
  isInstructorAnyCourse: function () {
    return !!Courses.findOne({ instructors: this._id })
  },
  coursesInstructed: function () {
    return _(Courses.find({ instructors: this._id }).fetch()).pluck('_id') || []
  },
  isInstructor: function (courseId) {
    if (!courseId) return false
    check(courseId, Helpers.MongoID)
    const c = Courses.findOne(courseId)
    return c ? _.contains(c.instructors, this._id) : false
  },
  isStudent: function (courseId) {
    if (!courseId) return false
    check(courseId, Helpers.MongoID)
    const c = Courses.findOne(courseId)
    return c ? _.contains(c.students, this._id) : false
  },
  hasGreaterRole: function (role) {
    if (this.profile.roles.indexOf(role) !== -1) return true
    else if (role === ROLES.prof && this.profile.roles.indexOf(ROLES.admin) !== -1) return true
    else return false
  },
  getImageUrl: function () {
    if (this.profile.profileImage) {
  
      if ( /https:\/\/.*\.s3-\..*\.amazonaws\.com.*/.test( this.profile.profileImage) && !this.profile.profileImage.endsWith('/image')) {
        Meteor.call('users.updateProfileImage', this.profile.profileImage + '/image')
      }
      if ( /https:\/\/.*\.s3-\..*\.amazonaws\.com.*/.test( this.profile.profileImage) && !this.profile.profileThumbnail.endsWith('/thumbnail')) {
        Meteor.call('users.updateProfileThumbnail', this.profile.profileThumbnail + '/thumbnail')
      }
      return this.profile.profileImage
    } 
    
    else return '/images/avatar.png'
  },

  getThumbnailUrl: function () {
    if (this.profile.profileThumbnail) return this.profile.profileThumbnail
       
    else if (this.profile.profileImage) { // set profile thumbnail if an image exists
      if ( /https:\/\/.*\.s3-\..*\.amazonaws\.com.*/.test( this.profile.profileImage) && !this.profile.profileImage.endsWith('/image')) {
        Meteor.call('users.updateProfileImage', this.profile.profileThumbnail + '/thumbnail')
      }
      Meteor.call('users.updateProfileThumbnail', this.profile.profileImage)
      return this.profile.profileImage
    }
    
    else return '/images/avatar.png'
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

Accounts.config({
  loginExpirationInDays: (1 / 24) * 2
})

if (Meteor.isServer) {
  Meteor.publish('userData', function () {
    if (this.userId) return Meteor.users.find({ _id: this.userId })
    else this.ready()
  })

  // TODO: where appropriate, switch to this publication!
  Meteor.publish('users.studentsInCourse', function (courseId) {
    if (!this.userId) return this.ready()
    const user = Meteor.users.findOne({ _id: this.userId })
    const course = Courses.findOne({ _id: courseId })
    if (!course || !user) return this.ready()

    if (user.isInstructor(courseId) || user.hasGreaterRole(ROLES.admin)) {
      let students = course.students ? course.students : []
      return Meteor.users.find({_id: {$in: students}}, {fields: {services: false}})
    } else {
      if (_.indexOf(course.students, this.userId) > -1) {
        return Meteor.users.find({_id: this.userId}, {fields: {services: false}})
      } else {
        return this.ready()
      }
    }
  })

  // TODO: where appropriate, switch to this publication!
  Meteor.publish('users.instructorsInCourse', function (courseId) {
    if (!this.userId) return this.ready()
    const user = Meteor.users.findOne({ _id: this.userId })
    const course = Courses.findOne({ _id: courseId })
    if (!course || !user) return this.ready()

    if (user.isInstructor(courseId) || user.hasGreaterRole(ROLES.admin)) {
      let instructors = course.instructors ? course.instructors : []
      return Meteor.users.find({_id: {$in: instructors}}, {fields: {services: false}})
    } else return this.ready()
  })

  Meteor.publish('users.myStudents', function (params) {
    if (!this.userId) return this.ready()
    const user = Meteor.users.findOne({ _id: this.userId })

    if (user && (user.hasGreaterRole(ROLES.prof) || user.isInstructorAnyCourse())) {
      let studentRefs = []
      Courses.find({ instructors: user._id }).fetch().forEach((c) => {
        studentRefs = studentRefs.concat(c.students || [])
      })
      return Meteor.users.find({_id: {$in: studentRefs}}, {fields: {services: false}})
    } else if (user && user.hasGreaterRole(ROLES.student)) {
      return Meteor.users.find({_id: this.userId}, {fields: {services: false}})
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
    } else if (Courses.findOne({ instructors: user._id })) {
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
   * send verification to another user email
   */
  'users.sendVerificationEmailTo' (toUserId) {
    let userId = Meteor.userId()
    if (userId && Meteor.isServer && Meteor.user.hasGreaterRole(ROLES.admin)) {
      return Accounts.sendVerificationEmail(toUserId)
    } else {
      throw new Meteor.Error('not-authorized', 'not-authorized')
    }
  },
  /**
   * update profile image with new image in S3 collection
   * @param {String} profileImageUrl
   */
  'users.updateProfileImage' (profileImageUrl) {
    check(profileImageUrl, String)
    return Meteor.users.update({ _id: Meteor.userId() }, {
      '$set': { 'profile.profileImage': profileImageUrl }
    })
  },

  'users.updateProfileThumbnail' (profileImageUrl) {
    check(profileImageUrl, String)
    return Meteor.users.update({ _id: Meteor.userId() }, {
      '$set': { 'profile.profileThumbnail': profileImageUrl }
    })
  },

  /**
   * change to new email
   * @param {String} newEmail
   */
  'users.changeEmail' (newEmail) {
    check(newEmail, Helpers.Email)
    Meteor.users.update({ _id: Meteor.userId() }, {
      '$set': { 'emails': [ { address: newEmail, verified: false } ] }
    })
    return Meteor.call('users.sendVerificationEmail')
  },

  'users.verifyEmail' (email) {
    check(email, Helpers.Email)
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

    // Prevent the case of no administrators running qlicker.
    const user = Meteor.users.findOne({ _id: uId })
    if (user.hasRole(ROLES.admin) && newRole !== ROLES.admin) {
      const numberOfAdmins = Meteor.users.find({ 'profile.roles': ROLES.admin }).count()
      if (numberOfAdmins < 2) throw new Meteor.Error('keep-single-admin', 'There must be at least one admin account running qlicker.')
    }

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
    check(newRole, String)
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

    // Prevents a professor from demoting an admin.
    if (user.hasRole(ROLES.admin)) throw new Meteor.Error('no-demote-admin', 'Cannot demote an admin to professor.')

    return Meteor.users.update({ _id: user._id }, {
      '$set': { 'profile.roles': [ ROLES.prof ] }
    })
  },

  'users.count' () {
    return Meteor.users.find().count()
  },

  'users.createFromAdmin' (user) {
    if (!Meteor.user().hasGreaterRole(ROLES.admin)) throw new Meteor.Error('invalid-permissions', 'Invalid permissions')
    const userId = Accounts.createUser(user)
    if (Meteor.isServer) {
      Accounts.sendEnrollmentEmail(userId)
    }
    return userId
  },

  'users.delete' (user) {
    if (!Meteor.user().hasGreaterRole(ROLES.admin)) throw new Meteor.Error('invalid-permissions', 'Invalid permissions')
    if (Meteor.isServer) {
      Meteor.users.remove({_id: user._id}, function (e, r) {
        if (e) {
          throw new Meteor.Error(e, e)
        }
      })
    }
  }
})
