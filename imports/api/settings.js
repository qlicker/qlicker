// QLICKER
// Author: Enoch T <me@enocht.am>
//
// courses.js: JS related to course collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

import { _ } from 'underscore'

import Helpers from './helpers.js'
// import { Sessions } from './sessions.js'
import { ROLES } from '../configs'

const pattern = {
  _id: Match.Maybe(Helpers.NEString), // mongo db id
  restrict: Match.Maybe(Boolean), // Information Technology Project (2016-17)
  allowed: Match.Maybe([Helpers.NEString])
}

// Create course class
export const Setting = function (doc) { _.extend(this, doc) }

// Create course collection
export const Settings = new Mongo.Collection('settings',
  { transform: (doc) => { return new Setting(doc) } })

// data publishing
if (Meteor.isServer) {
  Meteor.publish('settings', function () {
    if (this.userId) {
      let user = Meteor.users.findOne({ _id: this.userId })
      if (user.hasGreaterRole(ROLES.admin)) {
        return Settings.find()
      } else this.ready()
    } else this.ready()
  })
}

/* Accounts.config({ restrictCreationByEmailDomain: (email) => {
  const allowed = Meteor.call('confirmAccount', (email))
  if (!allowed) throw new Meteor.Error(403, 'Invalid email domain')
  else return true
}}) */

/**
 * Meteor methods for courses object
 * @module courses
 */
Meteor.methods({

  /**
   * insert new course object into Courses mongodb Collection
   * @param {Course} course - course object without id
   * @returns {MongoId} id of new course
   */
  'settings.insert' (settings) {
    check(settings, pattern)
    if (this.userId) {
      let user = Meteor.users.findOne({_id: this.userId})
      if (user.hasGreaterRole(ROLES.admin)) {
        const exists = Settings.findOne()
        if (exists) {
          Settings.update(exists._id, settings)
        }
        return Settings.insert(settings)
      }
    }
    return
  },

  'settings.update' (settings) {
    check(settings, pattern)
    if (this.userId) {
      let user = Meteor.users.findOne({_id: this.userId})
      if (user.hasGreaterRole(ROLES.admin)) {
        return Settings.update(settings._id, settings)
      }
    }
    return
  },

  'confirmAccount' (email) {
    var domain = email.substring(email.lastIndexOf('@') + 1)
    const settings = Settings.findOne()
    if (settings) { // (restrict) implies (domain in list) === not (restrict) || (domain in list)
      const contains = _.find(settings.allowed, function (dom) { return domain === dom })
      const approved = !settings.restrict || (contains !== undefined)
      if (!approved) throw new Meteor.Error(403, 'Invalid email domain')
      return approved
    }
    return true
  }

}) // end Meteor.methods

