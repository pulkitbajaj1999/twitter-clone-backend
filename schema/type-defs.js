const { gql } = require('apollo-server')
const typeDefs = gql`
  type User {
    id: ID!
    firstName: String
    lastName: String
    userName: String
    email: String
    posts: [String]
    following: [String]
    beingFollowed: Boolean
  }

  type Post {
    id: ID
    userId: ID
    body: String
    timeStamp: String
    fullName: String
    userName: String
  }

  type LoginResult {
    token: String
    user: User
  }

  type Query {
    users(searchQuery: String): [User]
    user: User
    posts(userId: ID!, searchQuery: String): [Post]
    post(postId: ID!): Post
    login(email: String!, password: String!): LoginResult
  }

  type Mutation {
    createUser(
      firstName: String
      lastName: String
      userName: String!
      email: String!
      password: String!
    ): User
    updateUser(
      userId: ID!
      firstName: String
      lastName: String
      bio: String
    ): User
    deleteUser(userId: ID!): User

    createPost(userId: ID!, body: String): Post
    updatePost(postId: ID!, body: String): Post
    deletePost(postId: ID!): Post

    toggleFollowing(otherUserId: ID!): [String]
  }
`
module.exports = typeDefs
