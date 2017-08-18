import { Meteor } from 'meteor/meteor'

import '../imports/api/users.js'
import '../imports/api/courses.js'
import '../imports/api/sessions.js'
import '../imports/api/questions.js'
import '../imports/api/responses.js'
import '../imports/api/images.js'

import { Settings } from '../imports/api/settings.js'

Meteor.startup(() => {
  if (!Settings.findOne()) {
    Settings.insert({restrictDomain: false,
      allowedDomains: [],
      maxImageSize: 3,
      maxImageWidth: 700
    })
  }
  if (process.env.QLICKER_MAIL_PASSWORD) {
    process.env.MAIL_URL = 'smtp://admin%40qlicker.etdev.ca:' + process.env.QLICKER_MAIL_PASSWORD + '@smtp.mailgun.org:587'
  }
})
