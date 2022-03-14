const { accounts: accountsConfig, countries, languages } = require('../new-admin/config')
const plugins = require('../plugins')

const machineConfig = (parent, { deviceId, deviceTime, machineVersion, machineModel }, context, info) => {
  const pi = plugins(settings, deviceId)

  return pi.pollQueries(deviceTime, machineVersion, machineModel)
    .then(_.flow(
      _.pick([
        'areThereAvailablePromoCodes',
        'balances',
        'cassettes'
      ]),
      _.set('id', deviceId)
    ))
}

module.exports = {
  Query: { machineConfig }
}
