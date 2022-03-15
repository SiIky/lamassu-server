const { ApolloServer } = require('apollo-server')
module.exports = new ApolloServer({
  typeDefs: require('./types'),
  resolvers: require('./resolvers')
})
