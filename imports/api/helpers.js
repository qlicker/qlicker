
import { check, Match } from 'meteor/check'

// Helpers

const Helpers = {

  chars: 'abcdefghijklmnopqrstuvwxyz0123456789',

  NEString: Match.Where(function (x) {
    check(x, String)
    return x.length > 0
  }),
  MongoID: Match.Where(function (id) {
    check(id, String)
    return /[0-9a-fA-F]{24}/.test(id)
  }),

  RandomEnrollmentCode: function () {
    return Array(6).join().split(',').map(function () { return Helpers.chars.charAt(Math.floor(Math.random() * Helpers.chars.length)) }).join('')
  }

}

export default Helpers

