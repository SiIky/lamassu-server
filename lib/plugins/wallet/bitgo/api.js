const axios = require('axios')

const URLS = {
  test: "https://app.bitgo-test.com/api/v2/",
  prod: "https://app.bitgo.com/api/v2/",
}

module.exports = ({ accessToken, env, userAgent, coin, walletId }) => {
  const bitgo = axios.create({
    baseURL: URLS[env],
    headers: {
      Authorization: "Bearer " + accessToken,
      'User-Agent': userAgent,
    },
  })

  /**
   * @param coin A cryptocurrency or token ticker symbol.
   * @param walletId The wallet ID.
   * @see https://developers.bitgo.com/api/v2.wallet.get
   */
  const getWallet = () => bitgo.get(`/${coin}/wallet/${walletId}`)

  /**
   * @param coin A cryptocurrency or token ticker symbol.
   * @param walletId The wallet ID.
   * @param address Destination address.
   * @param amount Amount in base units (e.g. satoshi, wei, drops, stroops).
   * @param walletPassphrase Passphrase to decrypt the user key on the wallet.
   * @param enforceMinConfirmsForChange When set to true, will enforce minConfirms for change outputs. Defaults to false.
   *
   * @see https://developers.bitgo.com/api/express.wallet.sendcoins
   */
  const send = ({ address, amount, walletPassphrase, enforceMinConfirmsForChange }) =>
    bitgo.post(`/${coin}/wallet/${walletId}/sendcoins`, {
      data: { address, amount, walletPassphrase, enforceMinConfirmsForChange }
    })

  /**
   * @param coin A cryptocurrency or token ticker symbol.
   * @param walletId The wallet ID.
   * @param label A human-readable label for the address.
   *
   * @see https://developers.bitgo.com/api/v2.wallet.newaddress
   */
  const createAddress = ({ label }) =>
    bitgo.post(`/${coin}/wallet/${walletId}/address`, {
      data: { label }
    })

  return {
    createAddress,
    getWallet,
    send,
  }
}
