const _ = require('lodash/fp')

const { accounts: accountsConfig, countries, languages } = require('../new-admin/config')
const plugins = require('../plugins')
const settingsLoader = require('../new-settings-loader.js')

const VERSION = require('../../package.json').version

const spy = msg =>
  x => {
    console.debug(msg, x)
    return x
  }

const massageBalances = _.flow(
  _.toPairs,
  _.map(([cryptoCode, balance]) => ({ cryptoCode, balance }))
)

const massageCassettes = _.flow(
  cassettes => _.set('physical', _.get('cassettes', cassettes), cassettes),
  cassettes => _.set('virtual', _.get('virtualCassettes', cassettes), cassettes),
  _.unset('cassettes'),
  _.unset('virtualCassettes')
)

const massageCoins = _.map(_.update('timestamp', ts => ts.toString()))

const massageRates = _.flow(
  _.toPairs,
  _.map(([cryptoCode, rates]) => _.set('cryptoCode', cryptoCode, rates))
)

const staticConfig = (parent, variables, { deviceId, settings }, info) =>
  plugins(settings, deviceId)
    .pollQueries()
    .then(_.flow(
      _.update('balances', massageBalances),
      _.update('cassettes', massageCassettes),
      _.update('coins', massageCoins),
      _.update('rates', massageRates)
    ))
    .then(_.flow(
      _.pick([
        'areThereAvailablePromoCodes',
        'balances',
        'cassettes',
        'coins',
        'configVersion',
        'rates',
        'timezone'
      ]),
      _.set('serverVersion', VERSION)
    ))
    //.then(spy('resolvers.js:staticConfig():gql_result:'))

const dynamicConfig = (parent, variables, { deviceId, settings }, info) => {
  return {}
}

/*
 * TODO(siiky): Call pollQueries() somewhere in the express call chain and use
 * its result in the resolvers.
 */
module.exports = {
  Query: {
    staticConfig,
    dynamicConfig
  }
}
