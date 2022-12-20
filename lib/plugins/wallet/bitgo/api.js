const _ = require('lodash/fp')
const axios = require('axios')

module.exports = ({ accessToken, env, userAgent, coin, walletId }) => {
  const urls = {
    test: "https://app.bitgo-test.com",
    prod: "https://app.bitgo.com",
  }

  // TODO(siiky): Default parameters here
  const req = axios.create({
    baseURL: urls[env],
    headers: {
      Authorization: "Bearer " + accessToken,
      'User-Agent': userAgent,
    },
  })

  const getWallet = () => undefined // GET
  const send = ({ params }) => undefined // POST
  const createAddress = () => undefined // POST
  const updateAddress = ({ address, label }) => undefined // PUT

  return {
    createAddress,
    getWallet,
    send,
    updateAddress,
  }
}
