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

  type CoinTickerRates {
    ask: String!
    bid: String!
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
    rates: CoinTickerRates!
    timestamp: String!
    batchable: Boolean!
  }

  type CoinCommissionRates {
    cryptoCode: String!
    cashIn: String!
    cashOut: String!
  }

  type MachineConfig {
    id: ID!
    areThereAvailablePromoCodes: Boolean!
    balances: [BalanceTuple!]!
    cassettes: Cassettes!
    coins: [Coin!]!
    configVersion: Int!
    timezone: Int!
    rates: [CoinCommissionRates!]!
  }

  type Query {
    machineConfig(deviceId: ID!): MachineConfig!
  }
`
