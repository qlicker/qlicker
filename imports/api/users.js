
import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'

/*
 * profile: {
 *  firstname: '',
 *  lastname: '',
 *  roles: ['student', 'professor', 'admin']
 * } 
 */

if (Meteor.isServer) {
  Meteor.publish("userData", function () {
    if (this.userId) {
      return Meteor.users.find({_id: this.userId});
    } else {
      this.ready();
    }
  });
}
