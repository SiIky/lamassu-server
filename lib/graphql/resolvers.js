const { GraphQLJSONObject: JSONObject } = require('graphql-type-json')

const { accounts: accountsConfig, countries, languages } = require('../new-admin/config')
const plugins = require('../plugins')

const machineConfig = (parent, { deviceId }, context, info) => {
  /*
   * TODO(siiky): get the `settings`. For `lib/routes/pollingRoutes.js:poll()`
   *              it comes from `lib/middlewares/populateSettings.js`.
   */
  const pi = plugins(settings, deviceId)

  return pi.pollQueries()
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
      _.set('id', deviceId)
    ))
}

module.exports = {
  JSONObject,
  Query: { machineConfig }
}
