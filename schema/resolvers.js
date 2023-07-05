const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret'
const LOGIN_PERIOD_SEC = process.env.LOGIN_PERIOD_SEC || 3600

const Post = require('../models/post')
const User = require('../models/user')

const ERROR_NOT_AUTHENTICATED = new Error('User not authenticated!')
const ERROR_NOT_AUTHORIZED = new Error(
  'User not authorized for current operation!'
)
const resolvers = {
  Query: {
    posts: async (parent, args, context) => {
      if (!context?.isAuthenticated) {
        return ERROR_NOT_AUTHENTICATED
      }
      const { userId } = args
      if (userId !== context?.userId) return ERROR_NOT_AUTHORIZED

      // const searchQuery = args.searchQuery
      // const options = searchQuery
      //   ? {
      //       $or: [
      //         { firstName: { $regex: searchQuery, $options: 'i' } },
      //         { lastName: { $regex: searchQuery, $options: 'i' } },
      //       ],
      //     }
      //   : {}

      const user = await User.findById(userId).lean()
      const following = await user.following
      const followerPosts = await Post.find({
        userId: { $in: user.following },
      })
        .populate('userId')
        .lean()
      const userPosts = await Post.find({ _id: { $in: user.posts } })
        .populate('userId')
        .lean()

      const combinedPosts = [...followerPosts, ...userPosts]
      combinedPosts.sort((a, b) => {
        return b.timeStamp - a.timeStamp
      })
      return combinedPosts.map((post) => ({
        ...post,
        id: post._id,
        userName: post.userId.userName,
        fullName: `${post.userId.firstName} ${post.userId.lastName}`,
        userId: post.userId._id,
      }))
    },
    post: async (parent, args, context) => {
      if (!context.isAuthenticated) throw ERROR_NOT_AUTHENTICATED
      const { postId } = args
      const post = await Post.findById(postId)
      return post
    },

    // USER RESOLVERS
    users: async (parent, args, context) => {
      if (!context.isAuthenticated) throw ERROR_NOT_AUTHENTICATED
      const userId = context?.userId
      const user = await User.findById(userId).lean()
      const users = await User.find({ _id: { $ne: userId } }).lean()

      const checkIsBeingFollowed = (otherUserId) => {
        const index = user.following.findIndex(
          (userId) => userId.toString() === otherUserId.toString()
        )
        return index >= 0
      }
      return users.map((user) => ({
        ...user,
        id: user._id,
        beingFollowed: checkIsBeingFollowed(user._id),
      }))
    },
    user: async (parent, args, context) => {
      if (!context.isAuthenticated) throw ERROR_NOT_AUTHENTICATED
      const userId = context?.userId
      if (!userId)
        throw new Error(
          'user not found in context object try to reauthenticate'
        )
      const user = await User.findById(userId)
      return user
    },
    login: async (parent, args, context) => {
      const { email, password } = args
      if (!email || !password) return null

      const user = await User.findOne({ email }).lean()
      if (!user) throw new Error('user does not exist')

      const isMatch = await bcryptjs.compare(password, user.password)
      if (!isMatch) throw new Error('password incorrect')

      const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, {
        expiresIn: LOGIN_PERIOD_SEC,
      })
      return { token, user: { ...user, id: user._id } }
    },
  },

  Mutation: {
    createUser: async (parent, args, context) => {
      const { email, password, firstName, lastName, userName } = args

      const existingUser = await User.findOne({ email })
      if (existingUser) {
        throw new Error('user already exists')
      }
      let user = new User({ email, firstName, lastName, userName })
      const hashedPassword = await bcryptjs.hash(password, 12)
      user.password = hashedPassword
      await user.save()
      return user
    },

    updateUser: async (parent, args, context) => {
      if (!context?.isAuthenticated) return ERROR_NOT_AUTHENTICATED
      const { userId, firstName, lastName, bio } = args
      if (userId !== context?.userId) return ERROR_NOT_AUTHORIZED
      const user = await User.findById(userId)
      user.firstName = firstName
      user.lastName = lastName
      user.bio = bio
      return await user.save()
    },

    deleteUser: async (parent, args, context) => {
      if (!context.isAuthenticated) throw ERROR_NOT_AUTHENTICATED
      const { userId } = args
      const user = await User.findById(userId)
      if (!user) return null
      await User.deleteOne({ email: user.email })
      return user
    },

    toggleFollowing: async (parent, args, context) => {
      if (!context.isAuthenticated) throw ERROR_NOT_AUTHENTICATED
      const { otherUserId } = args
      const userId = context.userId
      let user = await User.findById(userId)
      user = await user.toggleFollowing(otherUserId)
      return user.following
    },

    createPost: async (parent, args, context) => {
      if (!context.isAuthenticated) throw ERROR_NOT_AUTHENTICATED
      const { userId, body } = args
      if (userId !== context.userId) throw ERROR_NOT_AUTHORIZED
      const user = await User.findById(userId)
      if (!user) throw new Error('userId is incorrect or user does not exist')
      const post = new Post({
        body: body,
        userId: userId,
        timeStamp: new Date(),
      })
      await post.save()
      user.posts.push(post)
      await user.save()
      return {
        ...post.toObject(),
        id: post._id,
        fullName: `${user.firstName} ${user.lastName}`,
        userName: user.userName,
      }
    },

    updatePost: async (parent, args, context) => {
      console.log('updating post')
      if (!context.isAuthenticated) throw ERROR_NOT_AUTHENTICATED
      const { postId, body } = args
      let post = await Post.findById(postId).populate('userId')
      if (!post) throw new Error('post not found')
      post.body = body
      await post.save()
      return {
        ...post.toObject(),
        id: post._id,
        fullName: `${post?.userId?.firstName} ${post?.userId?.lastName}`,
        userName: post?.userId?.userName,
        userId: post.userId._id,
      }
    },

    deletePost: async (parent, args, context) => {
      if (!context.isAuthenticated) throw ERROR_NOT_AUTHENTICATED
      const { postId, body } = args
      const post = await Post.findByIdAndDelete(postId)
      if (!post) throw new Error('post not found')
      return post
    },
  },
}

module.exports = resolvers
