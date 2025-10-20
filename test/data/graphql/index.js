const path = require('path')
const jsonServer = require('json-server')
const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { resolvers, typeDefs } = require('./schema')

const TestHelper = require('../../support/TestHelper')

const PORT = TestHelper.graphQLServerPort()

// Note: json-server components below are not actually used in this GraphQL server
// They are imported but not connected to the Apollo server
const app = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middleware = jsonServer.defaults()

const server = new ApolloServer({
  typeDefs,
  resolvers,
  playground: true,
})

const res = startStandaloneServer(server, { listen: { port: PORT } })
res.then(({ url }) => {
  console.log(`test graphQL server listening on ${url}...`)
})

module.exports = res
