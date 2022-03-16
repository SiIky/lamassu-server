const logger = require('../logger')

const https = require('https')
const { ApolloServer } = require('apollo-server-express')

const devMode = !!require('minimist')(process.argv.slice(2)).dev

module.exports = new ApolloServer({
  typeDefs: require('./types'),
  resolvers: require('./resolvers'),
  uploads: false,
  playground: false,
  introspection: false,
  formatError: error => {
    logger.error(error)
    return error
  },
  debug: devMode,
  logger
})
