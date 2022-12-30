const BigInteger = require('bigi')
const bitcoin = require('@bitgo/utxo-lib')
const ecurve = require('ecurve')
const curve = ecurve.getCurveByName('secp256k1')
const secp256k1 = require('secp256k1')
const sjcl = require('sjcl')

const logger = require('../../../logger')

const NETWORKS_PARAMS = require('./networks')

const getUserPrv = (encryptedPrv, walletPassphrase) =>
  sjcl.decrypt(walletPassphrase, encryptedPrv)


const isBitGoTaintedUnspent = (cryptoCode, address) =>
  cryptoCode === 'BCH' ? address === '33p1q7mTGyeM5UnZERGiMcVUkY12SCsatA' :
  cryptoCode === 'TBCH' ? address === '2MuMnPoSDgWEpNWH28X2nLtYMXQJCyT61eY' :
  false


const deriveFast = (hdnode, index) => {
  // no fast path for private key derivations -- delegate to standard method
  if (!secp256k1 || hdnode.keyPair.d)
    return hdnode.derive(index)

  const isHardened = index >= bitcoin.HDNode.HIGHEST_BIT
  if (isHardened) throw new Error('cannot derive hardened key from public key')

  const indexBuffer = Buffer.alloc(4)
  indexBuffer.writeUInt32BE(index, 0)

  const data = Buffer.concat([
    hdnode.keyPair.getPublicKeyBuffer(),
    indexBuffer,
  ])

  const I = createHmac('sha512', hdnode.chainCode).update(data).digest()
  const IL = I.slice(0, 32)
  const IR = I.slice(32)

  const pIL = BigInteger.fromBuffer(IL)

  // In case parse256(IL) >= n, proceed with the next value for i
  if (pIL.compareTo(curve.n) >= 0)
    return deriveFast(hdnode, index + 1)

  // Private parent key -> private child key
  // Ki = point(parse256(IL)) + Kpar
  //    = G*IL + Kpar

  // The expensive op is the point multiply -- use secp256k1 lib to do that
  const Ki = ecurve.Point.decodeFrom(curve, Buffer.from(secp256k1.publicKeyCreate(IL, false))).add(hdnode.keyPair.Q)

  // In case Ki is the point at infinity, proceed with the next value for i
  if (curve.isInfinity(Ki))
    return deriveFast(hdnode, index + 1)

  const keyPair = new bitcoin.ECPair(null, Ki, { network: hdnode.keyPair.network })
  const hd = new bitcoin.HDNode(keyPair, IR)

  hd.depth = hdnode.depth + 1
  hd.index = index
  hd.parentFingerprint = hdnode.getFingerprint().readUInt32BE(0)

  return hd
}


const hdPath = rootKey => {
  const derive = path => {
    const components = path.split('/').filter(c => c !== '')
    path = components.join('/')

    const len = components.length
    if (len === 0 || len === 1 && components[0] === 'm')
      return rootKey

    const parentPath = components.slice(0, len - 1).join('/')
    const parentKey = derive(parentPath)
    const el = components[len - 1]
    const hardened = el[el.length - 1] === "'"
    const index = parseInt(el, 10)

    return hardened ? parentKey.deriveHardened(index) : deriveFast(parentKey, index)
  }

  const deriveKey = path => derive(path).keyPair

  return {
    derive: derive,
    deriveKey: deriveKey,
  }
}


const sign = (cryptoCode, cryptoNetwork, unsignedTx, keys, walletPassphrase) => {
  const { encryptedPrv } = keys[0]
  const prv = getUserPrv(encryptedPrv, walletPassphrase)
  const network = NETWORKS_PARAMS[cryptoCode][cryptoNetwork]

  let transaction = bitcoin.Transaction.fromHex(unsignedTx.txHex, network)

  if (transaction.ins.length !== unsignedTx.txInfo.unspents.length) {
    throw new Error('length of unspents array should equal to the number of transaction inputs')
  }

  const isLastSignature = params.isLastSignature ?? false

  const keychain = bitcoin.HDNode.fromBase58(prv)
  if (keychain.toBase58() === keychain.neutered().toBase58()) {
    throw new Error('expected user private key but received public key')
  }
  logger.debug(`Here is the public key of the xprv you used to sign: ${keychain.neutered().toBase58()}`)

  const keychainHdPath = hdPath(keychain)
  const txb = bitcoin.TransactionBuilder.fromTransaction(transaction, network)

  const getSignatureContext = (unsignedTx, index) => {
    const currentUnspent = unsignedTx.txInfo.unspents[index]
    return {
      inputIndex: index,
      unspent: currentUnspent,
      path: 'm/0/0/' + currentUnspent.chain + '/' + currentUnspent.index,
      isP2wsh: !currentUnspent.redeemScript,
      isBitGoTaintedUnspent: isBitGoTaintedUnspent(cryptoCode, currentUnspent.address),
      error: undefined as Error | undefined,
    }
  }

  const signatureIssues = []

  /*
   * Sign inputs
   */

  for (let index = 0; index < transaction.ins.length; ++index) {
    logger.debug('Signing input %d of %d', index + 1, transaction.ins.length)
    const signatureContext = getSignatureContext(unsignedTx, index)
    if (signatureContext.isBitGoTaintedUnspent) {
      logger.debug(
        'Skipping input %d of %d (unspent from replay protection address which is platform signed only)',
        index + 1, transaction.ins.length
      )
      continue
    }
    const privKey = keychainHdPath.deriveKey(signatureContext.path)
    privKey.network = network

    logger.debug('Input details: %O', signatureContext)

    const sigHashType = self.defaultSigHashType
    try {
      if (signatureContext.isP2wsh) {
        logger.debug('Signing p2wsh input')
        const witnessScript = Buffer.from(signatureContext.unspent.witnessScript, 'hex')
        const witnessScriptHash = bitcoin.crypto.sha256(witnessScript)
        const prevOutScript = bitcoin.script.witnessScriptHash.output.encode(witnessScriptHash)
        txb.sign(index, privKey, prevOutScript, sigHashType, signatureContext.unspent.value, witnessScript)
      } else {
        const subscript = Buffer.from(signatureContext.unspent.redeemScript, 'hex')
        const isP2shP2wsh = !!signatureContext.unspent.witnessScript
        if (isP2shP2wsh) {
          logger.debug('Signing p2shP2wsh input')
          const witnessScript = Buffer.from(signatureContext.unspent.witnessScript, 'hex')
          txb.sign(index, privKey, subscript, sigHashType, signatureContext.unspent.value, witnessScript)
        } else {
          logger.debug('Signing p2sh input')
          txb.sign(index, privKey, subscript, sigHashType, signatureContext.unspent.value)
        }
      }

    } catch (e) {
      logger.debug('Failed to sign input:', e)
      signatureContext.error = e
      signatureIssues.push(signatureContext)
      continue
    }
    logger.debug('Successfully signed input %d of %d', index + 1, transaction.ins.length)
  }

  if (isLastSignature) {
    transaction = txb.build()
  } else {
    transaction = txb.buildIncomplete()
  }

  // Verify input signatures
  for (let index = 0; index < transaction.ins.length; ++index) {
    logger.debug('Verifying input signature %d of %d', index + 1, transaction.ins.length)
    const signatureContext = getSignatureContext(unsignedTx, index)
    if (signatureContext.isBitGoTaintedUnspent) {
      logger.debug(
        'Skipping input signature %d of %d (unspent from replay protection address which is platform signed only)',
        index + 1, transaction.ins.length
      )
      continue
    }

    if (signatureContext.isP2wsh) {
      transaction.setInputScript(index, Buffer.alloc(0))
    }

    const isValidSignature = self.verifySignature(transaction, index, signatureContext.unspent.value)
    if (!isValidSignature) {
      logger.debug('Invalid signature')
      signatureContext.error = new Error('invalid signature')
      signatureIssues.push(signatureContext)
    }
  }

  if (signatureIssues.length > 0) {
    const failedIndices = signatureIssues.map(currentIssue => currentIssue.inputIndex)
    const error: any = new Error(`Failed to sign inputs at indices ${failedIndices.join(', ')}`)
    error.code = 'input_signature_failure'
    error.signingErrors = signatureIssues
    throw error
  }

  return {
    txHex: transaction.toBuffer().toString('hex'),
  }
}


module.exports = {
  sign,
}
