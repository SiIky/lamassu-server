const { accounts: accountsConfig, countries, languages } = require('../new-admin/config')

const machineConfig = (parent, { deviceId }, context, info) => {
}

module.exports = {
  Query: { machineConfig }
}
