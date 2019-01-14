
import { _ } from 'underscore'

import { check, Match } from 'meteor/check'
import { QUESTION_TYPE, TF_ORDER, MC_ORDER } from '../configs'

// Helpers

const Helpers = {

  chars: 'abcdefghijklmnopqrstuvwxyz0123456789',

  tf_result: Match.Where(function (a) {
    check(a, Helpers.NEString)
    return _(TF_ORDER).contains(a)
  }),

  mc_result: Match.Where(function (a) {
    check(a, Helpers.NEString)
    return _(MC_ORDER).contains(a)
  }),

  // checkers
  NEString: Match.Where(function (x) {
    check(x, String)
    return x.length > 0
  }),
  MongoID: Match.Where(function (id) {
    //previous
    //check(id, Helpers.NEString)
    //return /[0-9a-fA-F]/.test(id)
    //but have seen documents where the id is a string, not a hex number:
    check(id, String)
    return id.length > 0
  }),
  Email: Match.Where(function (x) {
    check(x, String)
    return x.length <= 254 && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(x)
  }),
  QuestionType: Match.Where(function (n) {
    check(n, Number)
    return _(QUESTION_TYPE).chain().values().contains(n) || n === -1
  }),
  AnswerItem: Match.Where(function () {
    if (Match.test(Helpers.NEString)) return true
    if (Match.test(Helpers.mc_result) || Match.test(Helpers.tc_result)) return true
    if (Match.test([ Helpers.mc_result ])) return true
    return false
  }),

  RandomEnrollmentCode: function () {
    // TODO someone do some math on how often this will collide and wether or not we should do something about that
    return Array(6).join().split(',').map(function () { return Helpers.chars.charAt(Math.floor(Math.random() * Helpers.chars.length)) }).join('')
  }

}

export default Helpers
