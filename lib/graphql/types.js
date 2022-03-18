const { gql } = require('apollo-server-express')
module.exports = gql`
  type Balance {
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
    timestamp: String!
    batchable: Boolean!

    # TODO(siiky): This shouldn't be part of machine's config.
    rates: CoinTickerRates!
  }

  type CoinCommissionRates {
    cryptoCode: String!
    cashIn: String!
    cashOut: String!
  }

  type StaticConfig {
    areThereAvailablePromoCodes: Boolean!
    cassettes: Cassettes!
    coins: [Coin!]!
    configVersion: Int!
    serverVersion: String!
    timezone: Int!

    # TODO(siiky): These shouldn't be part of machine's config.
    balances: [Balance!]!
    rates: [CoinCommissionRates!]!
  }

  type DynamicConfig {
    # TODO(siiky): Move fields mentioned above here
    placeholder: Boolean
  }

  type Query {
    staticConfig: StaticConfig!
    dynamicConfig: DynamicConfig!
  }
`
