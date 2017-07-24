/* global FS */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// images.js: JS related to image collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { Slingshot } from 'meteor/edgee:slingshot'
import { check, Match } from 'meteor/check'

import { Courses } from './courses'

import { _ } from 'underscore'

import Helpers from './helpers.js'
import { ROLES } from '../configs'

// Create Image class
const Image = function (doc) { _.extend(this, doc) }
_.extend(Image.prototype, {
})

// Create image collection
export const Images = new Mongo.Collection('images',
  { transform: (doc) => { return new Image(doc) } })

// data publishing
if (Meteor.isServer) {
  Meteor.publish('images', function () {
    if (this.userId) {
      return Images.find({})
    } else this.ready()
  })
}

/**
 * Meteor methods for images object
 * @module images
 */
Meteor.methods({

  /**
   * inserts a new image
   * @param {Image} image
   * @returns {Image} new image
   */
  'images.insert' (image) {
    const exists = !!Images.findOne({ dataURL: image.dataURL })
    if (exists) {
      return null//Meteor.call('images.update', image)
    }
    return Images.insert(image)
  },

  /**
   * updates all image details
   * @param {Image} image
   * @returns {MongoID} id of updated image
   */
  'images.update' (image) {
  },

  /**
   * Deletes an image by id
   * @param {MongoId} imageId
   */
  'images.delete' (imageId) {
  }

}) // end Meteor.methods
