const { gql } = require('apollo-server-express')
module.exports = gql`
  type PhysicalCassette {
    denomination: Int!
    count: Int!
  }

  type Cassettes {
    physical: [PhysicalCassette!]!
    virtual: [Int!]!
  }

  type Coin {
    cryptoCode: String!
    display: String!
    minimumTx: String!
    cashInFee: String!
    cashInCommission: String!
    cashOutCommission: String!
    cryptoNetwork: Boolean!
    cryptoUnits: String!
    batchable: Boolean!
  }

  type StaticConfig {
    areThereAvailablePromoCodes: Boolean!
    cassettes: Cassettes!
    coins: [Coin!]!
    configVersion: Int!
    serverVersion: String!
    timezone: Int!
  }

  type DynamicCoinValues {
    cryptoCode: String!
    balance: String!
    # NOTE: Doesn't seem to be used anywhere outside of lib/plugins.js
    #timestamp: String!

    # Raw rates
    ask: String!
    bid: String!

    # Rates with commissions applied
    cashIn: String!
    cashOut: String!
  }

  type Query {
    staticConfig: StaticConfig!
    dynamicConfig: [DynamicCoinValues!]!
  }
`
