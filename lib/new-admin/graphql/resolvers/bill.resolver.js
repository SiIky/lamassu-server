const bills = require('../../services/bills')

const resolvers = {
  Query: {
    bills: (parent, { filters }, ctx, info) => bills.getBills(filters)
  }
}

module.exports = resolvers
