require('dotenv').config()

const dbConnect = require('./utils/db').dbConnect

const { ApolloServer, gql, AuthenticationError } = require('apollo-server')

const typeDefs = require('./schema/type-defs')
const resolvers = require('./schema/resolvers')
const contextObject = require('./schema/context-object')

const PORT = process.env.PORT || 8000
const HOST = process.env.HOST || '0.0.0.0'
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/twitter-clone'

const serverConfig = {
  port: PORT,
  cors: true,
  typeDefs,
  resolvers,
  context: contextObject,
}

const server = new ApolloServer(serverConfig)

dbConnect(MONGODB_URI).then(() => {
  server.listen({ port: PORT }).then(({ url }) => {
    console.log(`Server ready at ${url}`)
  })
})
