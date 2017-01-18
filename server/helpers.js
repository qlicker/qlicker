

import { check, Match } from 'meteor/check'

// Helpers
//
exports.NonEmptyString = Match.Where(function (x) {
  check(x, String)
  return x.length > 0
}); 


