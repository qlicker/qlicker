

import { check, Match } from 'meteor/check'

// Helpers


const Helpers = {

  NEString : Match.Where(function (x) {
    check(x, String)
    return x.length > 0
  })

}

export default Helpers
  





