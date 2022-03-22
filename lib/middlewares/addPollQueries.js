const plugins = require('../plugins')

module.exports = function (req, res, next) {
  req.pollQueries = plugins(req.settings, req.deviceId).pollQueries()
  next()
}
