
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';


if (Meteor.isServer) {
  Meteor.publish("userData", function () {
    if (this.userId) {
      return Meteor.users.find({_id: this.userId});
    } else {
      this.ready();
    }
  });
}
