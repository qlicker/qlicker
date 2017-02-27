
import { _ } from 'underscore'

import { check, Match } from 'meteor/check'
import { QUESTION_TYPE }  from '../configs'

// Helpers

const Helpers = {

  chars: 'abcdefghijklmnopqrstuvwxyz0123456789',

  tf_result: { answer: this.NEString },
  mc_result: { answer: this.NEString },
  ms_result: { answer: [ this.NEString ] },
  sa_result: { answer: this.NEString },

  // checkers
  NEString: Match.Where(function (x) {
    check(x, String)
    return x.length > 0
  }),
  MongoID: Match.Where(function (id) {
    check(id, Helpers.NEString)
    return /[0-9a-fA-F]/.test(id)
  }),
  QuestionType: Match.Where(function (n) {
    check(n, Number)
    return _(QUESTION_TYPE).values().indexOf(n) > -1
  }),
  AnswerObject: Match.OneOf(this.tf_result, this.mc_result, this.ms_result, this.sa_result),

  RandomEnrollmentCode: function () {
    return Array(6).join().split(',').map(function () { return Helpers.chars.charAt(Math.floor(Math.random() * Helpers.chars.length)) }).join('')
  }

}

export default Helpers

