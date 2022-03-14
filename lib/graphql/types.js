const { gql } = require('apollo-server-express')
module.exports = gql`
  scalar JSONObject

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

  type MachineConfig {
    id: ID!
    areThereAvailablePromoCodes: Boolean!
    balances: [BalanceTuple!]!
    cassettes: Cassettes!
    coins: [Coin!]!
    configVersion: Int!
    timezone: Int!

    # TODO(siiky): Make it idiomatic GraphQL by converting the original value,
    # similarly to how it's done for rates. Currently, the field has this form:
    # {
    #   "ETH": {
    #     "cashIn": "106.05",
    #     "cashOut": "98.03922"
    #   },
    #   ...
    # }
    rates: JSONObject!
  }

  type Query {
    machineConfig(deviceId: ID!): MachineConfig!
  }
`
