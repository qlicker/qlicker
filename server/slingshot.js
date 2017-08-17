import { Meteor } from 'meteor/meteor'
import { Slingshot } from 'meteor/edgee:slingshot'

import { Settings } from '../imports/api/settings.js'

Slingshot.createDirective('QuestionImages', Slingshot.S3Storage, {
  allowedFileTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
  maxSize: null, // Unlimited, handled in authorized() instead
  bucket: Meteor.settings.bucket,
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
