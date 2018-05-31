import { Meteor } from 'meteor/meteor'
import { Slingshot } from 'meteor/edgee:slingshot'

import { Settings } from '../imports/api/settings.js'

// This creates an AWS S3 storage with no credentials
// Credentials can be changed in admin_dashboard

Slingshot.createDirective('QuestionImages', Slingshot.S3Storage, {
  
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
