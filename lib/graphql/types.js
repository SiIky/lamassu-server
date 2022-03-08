const { gql } = require('apollo-server-express')
module.exports = gql`
  type BalanceTuple {
    cryptoCode: String!
    balance: String!
  }

  type PhysicalCassette {
    denomination: Int!
    count: Int!
  }

  type Cassettes {
    physical: [PhysicalCassette!]!
    virtual: [Int!]!
  }

  type MachineConfig {
    id: ID!
    areThereAvailablePromoCodes: Boolean!
    balances: [BalanceTuple!]!
    cassettes: Cassettes!
  }

  type Query {
    machineConfig(deviceId: ID!): MachineConfig
  }
`
