import { Meteor } from 'meteor/meteor'

Slingshot.createDirective('QuestionImages', Slingshot.S3Storage, {
  allowedFileTypes: ['image/png', 'image/jpeg', 'image/jpg'],
  maxSize: 2 * 500 * 500,
  bucket: Meteor.settings.bucket,
  acl: 'public-read',

  authorize: function (file, metaContext) {
    console.log('HERE')
    return true
  },

  key: function (file, metaContext) {
    // User's image url with ._id attached:
    console.log('THERE')
    return 'test'
  }
})
