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

let azureBlobStorageService = {
  directiveMatch: {
    accountName: String,
    accountKey: String,
    options: Object
  },

  /**
   * Here you can set default parameters that your service will use.
   */

  directiveDefault: {
    options: {}
  },


  /**
   *
   * @param {Object} method - This is the Meteor Method context.
   * @param {Object} directive - All the parameters from the directive.
   * @param {Object} file - Information about the file as gathered by the
   * browser.
   * @param {Object} [meta] - Meta data that was passed to the uploader.
   *
   * @returns {UploadInstructions}
   */

  upload: function (method, directive, file, meta) {
   
    var accountName = directive.accountName
    var accountKey = directive.accountKey

    var fooData = directive.foo && directive.foo.call(method, file, meta)

    var azure = require('azure-storage')
    var tableSvc = azure.createTableService(accountName, accountKey)

    //Here you need to make sure that all parameters passed in the directive
    //are going to be enforced by the server receiving the file.

    alertify.error('fired')
    return {
      // Endpoint where the file is to be uploaded:
      upload: "https://qlickerblob.blob.core.windows.net/",

      // Download URL, once the file uploaded:
      download: "https://qlickerblob.blob.core.windows.net/blob1/" + file.name,

      // POST data to be attached to the file-upload:
      postData: [
        {
          name: "accessKey",
          value: accessKey
        },
        {
          name: "signature",
          value: signature
        }
        //...
      ],

      // HTTP headers to send when uploading:
      headers: {
        "x-foo-bar": fooData
      }
    };
  },
  
  /**
   * Absolute maximum file-size allowable by the storage service.
   */

  maxSize: 5 * 1024 * 1024 * 1024
}

Slingshot.createDirective('Azure', azureBlobStorageService, {
  
  allowedFileTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
  maxSize: 1024 * 1024,
  accountName: '',
  accountKey: '',

  authorize: function (file, metaContext) {
    if (file.size > (Settings.findOne().maxImageSize * 1024 * 1024)) {
      alertify.error('Image too large')
      return false
    }
    return Meteor.userId()
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
