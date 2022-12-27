const _ = require('lodash/fp')
const axios = require('axios')

const URLS = {
  test: "https://app.bitgo-test.com/api/v2/",
  prod: "https://app.bitgo.com/api/v2/",
}

module.exports = ({ accessToken, env, userAgent, coin, walletId }) => {
  const baseURL = URLS[env]
  if (!baseURL) throw new Error("`env` must be either `test` or `prod`")

  const https = axios.create({
    baseURL,
    headers: {
      Accept: 'application/json',
      Authorization: "Bearer " + accessToken,
      'User-Agent': userAgent,
    },
  })


  /**
   * @param coin A cryptocurrency or token ticker symbol.
   * @param walletId The wallet ID.
   * @see https://developers.bitgo.com/api/v2.wallet.get
   */
  const getWallet = () =>
    https.get(`/${coin}/wallet/${walletId}`)
      .then(_.get(['data']))


  /**
   * @see https://developers.bitgo.com/api/v2.wallet.tx.build
   *
   * TODO(siiky): Find the parameters etc
   */
  const buildTransaction = () =>
    https.post(`/${coin}/wallet/${walletId}/tx/build`, {
      data: {
      }
    })


  /**
   * @see https://developers.bitgo.com/api/v2.wallet.tx.send
   *
   * TODO(siiky): Find the parameters etc
   */
  const sendHalfSignedTransaction = () =>
    http.post(`/${coin}/wallet/${walletId}/tx/send`, {
      data: {
      }
    })


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
    https.post(`/${coin}/wallet/${walletId}/sendcoins`, {
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
    https.post(`/${coin}/wallet/${walletId}/address`, {
      data: { label }
    })
    .then(_.get(['data', 'address']))


  /**
   * @param coin A cryptocurrency or token ticker symbol.
   * @param walletId The wallet ID.
   *
   * @see https://developers.bitgo.com/api/v2.wallet.gettotalbalances
   */
  const balances = () =>
    https.get('/wallet/balances', {
      params: { coin, id: walletId }
    })
    .then(_.flow(
      _.get(['data', 'balances', 0]),
      _.pick(['balanceString', 'confirmedBalanceString']),
    ))


  /**
   * @param coin A cryptocurrency or token ticker symbol.
   * @param walletId The wallet ID.
   * @param type Filter on sending or receiving "Transfers".
   * @param address Return transfers with elements in "entries" that have an "address" field set to this value.
   *
   * @see https://developers.bitgo.com/api/v2.wallet.listtransfers
   */
  const transfers = ({ type, address }) =>
    https.get(`/${coin}/wallet/${walletId}/transfer`, {
      params: { type, address }
    })
    .then(_.get(['data', 'transfers']))


  /**
   * @see https://developers.bitgo.com/api/v2.key.list
   */
  const listKeys = () => https.get(`/${coin}/key`)


  return {
    balances,
    buildTransaction,
    createAddress,
    getWallet,
    https,
    listKeys,
    send,
    sendHalfSignedTransaction,
    transfers,
  }
}
