import { Meteor } from 'meteor/meteor'
import { Slingshot } from 'meteor/edgee:slingshot'

import { Settings } from '../imports/api/settings.js'

/**
 * Directive names correspond to storageType property in Settings.js
 */


// This creates an AWS S3 storage with no credentials
// Credentials can be changed in admin_dashboard

Slingshot.createDirective('AWS', Slingshot.S3Storage, {
  
  allowedFileTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
  maxSize: null, // Unlimited, handled in authorized() instead
  bucket: '',
  AWSAccessKeyId: '',
  AWSSecretAccessKey: '',
  acl: 'public-read',

  authorize: function (file, metaContext) {
    if (file.size > (Settings.findOne().maxImageSize * 1024 * 1024)) {
      alertify.error('Image too large')
      return false
    }
    return Meteor.userId()
  },

  key: function (file, metaContext) {
    return metaContext.UID + '/' + metaContext.type
  }
})

let fakeStorageService = {
  directiveMatch: {},
  directiveDefault: {
    authorize: function (file, metaContext) {
      throw new Meteor.Error('Image Uploading Unspecified')
    },
    maxSize: null,
    allowedFileTypes: null
  },
  upload: function (method, directive, file, meta) {
    throw new Meteor.Error('Image Uploading Unspecified')
  }
}

Slingshot.createDirective('None', fakeStorageService, {})