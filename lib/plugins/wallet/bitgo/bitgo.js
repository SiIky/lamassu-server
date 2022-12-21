const _ = require('lodash/fp')

const BitGo = require('bitgo')
const { toLegacyAddress, toCashAddress } = require('bchaddrjs')

const BN = require('../../../bn')

const E = require('../../../error')

const pjson = require('../../../../package.json')
const userAgent = 'Lamassu-Server/' + pjson.version

const bitgo = require('./api')

const NAME = 'BitGo'
const SUPPORTED_COINS = ['BTC', 'ZEC', 'LTC', 'BCH', 'DASH']
const BCH_CODES = ['BCH', 'TBCH']

const makeBitGo = (account, cryptoCode) => {
  const walletId = account[`${cryptoCode}WalletId`]

  cryptoCode = cryptoCode.toLowerCase()
  const coin = account.environment === 'test' ? `t${cryptoCode}` : cryptoCode

  const accessToken = account.token.trim()
  const env = account.environment === 'prod' ? 'prod' : 'test'

  return bitgo({ accessToken, env, userAgent, coin, walletId })
}

function checkCryptoCode (cryptoCode) {
  if (!SUPPORTED_COINS.includes(cryptoCode)) {
    return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode))
  }

  return Promise.resolve()
}

const getWallet = (account, cryptoCode) =>
  checkCryptoCode(cryptoCode)
    .then(() => makeBitGo(account, cryptoCode).getWallet())
    

function getLegacyAddress (address, cryptoCode) {
  if (!BCH_CODES.includes(cryptoCode)) return address

  return toLegacyAddress(address)
}

function getCashAddress (address, cryptoCode) {
  if (!BCH_CODES.includes(cryptoCode)) return address

  return toCashAddress(address)
}

function formatToGetStatus (address, cryptoCode) {
  if (!BCH_CODES.includes(cryptoCode)) return address

  const [part1, part2] = getLegacyAddress(address, cryptoCode).split(':')
  return part2 || part1
}

function sendCoins (account, tx, settings, operatorId) {
  const { toAddress, cryptoAtoms, cryptoCode } = tx
  return getWallet(account, cryptoCode)
    .then(wallet => {
      const params = {
        address: getLegacyAddress(toAddress, cryptoCode),
        amount: cryptoAtoms.toString(),
        walletPassphrase: account[`${cryptoCode}WalletPassphrase`],
        enforceMinConfirmsForChange: false
      }
      return wallet.send(params)
    })
    .then(result => {
      let fee = parseFloat(result.transfer.feeString)
      let txid = result.transfer.txid

      return { txid: txid, fee: new BN(fee).decimalPlaces(0) }
    })
    .catch(err => {
      if (err.message === 'insufficient funds') throw new E.InsufficientFundsError()
      throw err
    })
}

const balance = (account, cryptoCode) =>
  checkCryptoCode(cryptoCode)
    .then(() => makeBitGo(account, cryptoCode).balances())
    .then(_.flow(
      _.get(['balanceString']),
      b => new BN(b),
    ))


function newAddress (account, info, tx, settings, operatorId) {
  return getWallet(account, info.cryptoCode)
    .then(wallet => wallet.createAddress({ label: info.label }))
    .then(({ address }) => address)
    .then(address => getCashAddress(address, info.cryptoCode))
}

function getStatus (account, tx, requested, settings, operatorId) {
  const { toAddress, cryptoCode } = tx
  return getWallet(account, cryptoCode)
    // TODO(siiky): https://developers.bitgo.com/api/v2.wallet.listtransfers
    .then(wallet => wallet.transfers({
      type: 'receive',
      address: formatToGetStatus(toAddress, cryptoCode)
    }))
    .then(({ transfers }) => {
      const filterConfirmed = _.filter(it =>
        it.state === 'confirmed' && it.type === 'receive'
      )
      const filterPending = _.filter(it =>
        (it.state === 'confirmed' || it.state === 'unconfirmed') &&
        it.type === 'receive'
      )

      const sum = _.reduce((acc, val) => val.plus(acc), new BN(0))
      const toBn = _.map(it => new BN(it.valueString))

      const confirmed = _.compose(sum, toBn, filterConfirmed)(transfers)
      const pending = _.compose(sum, toBn, filterPending)(transfers)

      if (confirmed.gte(requested)) return { receivedCryptoAtoms: confirmed, status: 'confirmed' }
      if (pending.gte(requested)) return { receivedCryptoAtoms: pending, status: 'authorized' }
      if (pending.gt(0)) return { receivedCryptoAtoms: pending, status: 'insufficientFunds' }
      return { receivedCryptoAtoms: pending, status: 'notSeen' }
    })
}

const newFunding = (account, cryptoCode, settings, operatorId) =>
  checkCryptoCode(cryptoCode)
    .then(() => makeBitGo(account, cryptoCode))
    .then(bitgo => Promise.all([
      bitgo.createAddress({ label: 'Funding Address' }),
      bitgo.balances(),
    ]))
    .then(([fundingAddress, { balanceString, confirmedBalanceString }]) => ({
      fundingPendingBalance: new BN(balanceString).minus(confirmedBalanceString),
      fundingConfirmedBalance: new BN(confirmedBalanceString),
      fundingAddress: getCashAddress(fundingAddress, cryptoCode)
    }))


function cryptoNetwork (account, cryptoCode, settings, operatorId) {
  return checkCryptoCode(cryptoCode)
    .then(() => account.environment === 'test' ? 'test' : 'main')
}

function checkBlockchainStatus (cryptoCode) {
  return checkCryptoCode(cryptoCode)
    .then(() => Promise.resolve('ready'))
}

module.exports = {
  NAME,
  balance,
  sendCoins,
  newAddress,
  getStatus,
  newFunding,
  cryptoNetwork,
  checkBlockchainStatus
}
