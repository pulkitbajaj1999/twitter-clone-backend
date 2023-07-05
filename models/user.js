const mongoose = require('mongoose')
const Schema = mongoose.Schema

// define model structure
const userSchema = new Schema({
  profile: {
    type: Schema.Types.Mixed,
    required: false,
  },

  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },
  userName: {
    type: String,
    required: false,
  },
  bio: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: true,
  },
  posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
})

userSchema.methods.toggleFollowing = function (userId) {
  const followerIndex = this.following.indexOf(userId)
  if (followerIndex === -1) this.following.push(userId)
  else this.following.splice(followerIndex, 1)
  return this.save()
}

userSchema.methods.addPost = function (postId) {
  this.posts.push(postId)
  return this.save()
}

userSchema.methods.deletePost = function (postId) {
  const postIndex = this.posts.indexOf(postId)
  if (postIndex >= 0) {
    this.posts.splice(postIndex, 1)
    return this.save()
  }
  return this
}

module.exports = mongoose.model('User', userSchema)
