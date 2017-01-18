import { Meteor } from 'meteor/meteor'

import '../imports/api/users.js'
import '../imports/api/courses.js'

import { check, Match } from 'meteor/check'


Meteor.startup(() => {

});


// Helpers
//
NonEmptyString = Match.Where(function (x) {
  check(x, String)
  return x.length > 0
}); 
