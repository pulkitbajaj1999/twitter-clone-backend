const mongoose = require('mongoose')
const Schema = mongoose.Schema

// define model structure
const postSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  body: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: false,
  },
  timeStamp: {
    type: Date,
  },
})

module.exports = mongoose.model('Post', postSchema)
