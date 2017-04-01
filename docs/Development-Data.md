# Database

Qlicker uses 5 mongo collections for storing persistent data. A strict schema is not enforce on any of the collections. However, using the [meteor check](https://docs.meteor.com/api/check.html) library, data integrity is preserved on inserts and updates. An object pattern is described at the top of each of the respective files.

 - [`courses` (imports/api/courses.js)](../imports/api/courses.js)
 - [`questions` (imports/api/questions.js)](../imports/api/questions.js)
 - [`responses` (imports/api/responses.js)](../imports/api/responses.js)
 - [`sessions` (imports/api/sessions.js)](../imports/api/sessions.js)
 - [`users` (imports/api/users.js)](../imports/api/users.js)

As well, several GridFS collections are used for storing uploaded images.

 - `images` - for images uploaded via CKEditor for questions and answer options. This collection defined in [imports/api/questions.js](../imports/api/questions.js)
 - `profile_images` - for user profile images. This collection defined in [../imports/api/users.js](imports/api/users.js)

