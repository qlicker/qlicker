import { Settings } from '../../imports/api/settings'

Accounts.emailTemplates.siteName = 'Qlicker'
// server/main.js creates a document with an initial default email 
const fromEmail= Settings.findOne().email
Accounts.emailTemplates.from = "Qlicker Admin <"+fromEmail+">"

Accounts.emailTemplates.verifyEmail = {

  subject () {
    return '[Qlicker] Verify Your Email Address'
  },

  text (user, url) {
    const emailAddress = user.emails[0].address
    const urlWithoutHash = url.replace('#/', '')
    const supportEmail = fromEmail
    const emailBody = `To verify your email address (${emailAddress}) visit the following link:\n\n${urlWithoutHash}\n\n If you did not request this verification, please ignore this email. If you feel something is wrong, please contact ${supportEmail}.`

    return emailBody
  }
}

Accounts.urls.resetPassword = function (token) {
  return Meteor.absoluteUrl('reset/' + token)
}
