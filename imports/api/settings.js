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
  restrictDomain: Match.Maybe(Boolean), // Information Technology Project (2016-17)
  allowedDomains: Match.Maybe([Helpers.NEString]),
  maxImageSize: Match.Maybe(Number),
  maxImageWidth: Match.Maybe(Number),
  email: Match.Maybe(String),
  requireVerified: Match.Maybe(Boolean)
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
      }
    } else return Settings.find()
  })

  Accounts.validateLoginAttempt((options) => {
    if (!options.allowed) return false
    const sett = Settings.findOne()
    if (!sett.requireVerified || options.user.emails[0].verified === true) {
      return true
    } else {
      throw new Meteor.Error('email-not-verified', 'You must verify your email address.')
    }
  })
}

Accounts.config({ restrictCreationByEmailDomain: (email) => {
  const allowed = Meteor.call('confirmAccount', (email))
  if (!allowed) throw new Meteor.Error(403, 'Invalid email domain')
  else return true
}})

/**
 * Meteor methods for setting object
 * @module settings
 */
Meteor.methods({

  /**
   * insert new setting object into Settings mongodb Collection
   * @param {Settings} course - setting object without id
   * @returns {MongoId} id of new course
   */
  'settings.insert' (settings) {
    check(settings, pattern)
    if (this.userId) {
      let user = Meteor.users.findOne({_id: this.userId})
      if (user.hasGreaterRole(ROLES.admin)) {
        const exists = Settings.findOne()
        if (exists) Settings.update(exists._id, settings)
        else return Settings.insert(settings)
      }
    }
  },

  'settings.update' (settings) {
    check(settings, pattern)
    if (this.userId) {
      let user = Meteor.users.findOne({_id: this.userId})
      if (user.hasGreaterRole(ROLES.admin)) {
        if (settings.email && settings.email !== Settings.findOne().email && Meteor.isServer) {
          Accounts.emailTemplates.from = "Qlicker Admin <"+settings.email+">"
        }
        return Settings.update(settings._id, settings)
      }
    }
  },

  'settings.find' () {
    if (Meteor.userId()) {
      let user = Meteor.users.findOne({_id: Meteor.userId()})
      if (user.hasGreaterRole(ROLES.admin)) return Settings.findOne()
    }
    return Settings.findOne()
  },

  'confirmAccount' (email) {
    var domain = email.substring(email.lastIndexOf('@') + 1)
    const settings = Settings.findOne()
    if (settings) { // (restrict) implies (domain in list) === not (restrict) || (domain in list)
      const contains = _.find(settings.allowedDomains, function (dom) { return domain === dom })
      const approved = !settings.restrictDomain || (contains !== undefined)
      if (!approved) throw new Meteor.Error(403, 'Invalid email domain')
      return approved
    }
    return true
  }

}) // end Meteor.methods

