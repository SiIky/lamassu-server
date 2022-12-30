module.exports = {
  // https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp
  // https://github.com/bitcoin/bitcoin/blob/master/src/chainparams.cpp
  BTC: {
    main: {
      messagePrefix: '\x18Bitcoin Signed Message:\n',
      bech32: 'bc',
      bip32: getDefaultBip32Mainnet(),
      pubKeyHash: 0x00,
      scriptHash: 0x05,
      wif: 0x80,
      coin: 'btc'
    },
    test: {
      messagePrefix: '\x18Bitcoin Signed Message:\n',
      bech32: 'tb',
      bip32: getDefaultBip32Testnet(),
      pubKeyHash: 0x6f,
      scriptHash: 0xc4,
      wif: 0xef,
      coin: 'btc'
    },
  },

  // https://github.com/Bitcoin-ABC/bitcoin-abc/blob/master/src/validation.cpp
  // https://github.com/Bitcoin-ABC/bitcoin-abc/blob/master/src/chainparams.cpp
  BCH: {
    main: {
      messagePrefix: '\x18Bitcoin Signed Message:\n',
      bip32: getDefaultBip32Mainnet(),
      pubKeyHash: 0x00,
      scriptHash: 0x05,
      wif: 0x80,
      coin: 'bch',
      forkId: 0x00
    },
    test: {
      messagePrefix: '\x18Bitcoin Signed Message:\n',
      bip32: getDefaultBip32Testnet(),
      pubKeyHash: 0x6f,
      scriptHash: 0xc4,
      wif: 0xef,
      coin: 'bch'
    },
  },

  // https://github.com/dashpay/dash/blob/master/src/validation.cpp
  // https://github.com/dashpay/dash/blob/master/src/chainparams.cpp
  DASH: {
    main: {
      messagePrefix: '\x19DarkCoin Signed Message:\n',
      bip32: getDefaultBip32Mainnet(),
      pubKeyHash: 0x4c,
      scriptHash: 0x10,
      wif: 0xcc,
      coin: 'dash'
    },
    dashTest: {
      messagePrefix: '\x19DarkCoin Signed Message:\n',
      bip32: getDefaultBip32Testnet(),
      pubKeyHash: 0x8c,
      scriptHash: 0x13,
      wif: 0xef,
      coin: 'dash'
    },
  },

  // https://github.com/litecoin-project/litecoin/blob/master/src/validation.cpp
  // https://github.com/litecoin-project/litecoin/blob/master/src/chainparams.cpp
  LTC: {
    main: {
      messagePrefix: '\x19Litecoin Signed Message:\n',
      bech32: 'ltc',
      bip32: getDefaultBip32Mainnet(),
      pubKeyHash: 0x30,
      scriptHash: 0x32,
      wif: 0xb0,
      coin: 'ltc'
    },
    test: {
      messagePrefix: '\x19Litecoin Signed Message:\n',
      bech32: 'tltc',
      bip32: getDefaultBip32Testnet(),
      pubKeyHash: 0x6f,
      scriptHash: 0x3a,
      wif: 0xef,
      coin: 'ltc'
    },
  },

  // https://github.com/zcash/zcash/blob/master/src/validation.cpp
  // https://github.com/zcash/zcash/blob/master/src/chainparams.cpp
  ZEC: {
    main: {
      messagePrefix: '\x18ZCash Signed Message:\n',
      bip32: getDefaultBip32Mainnet(),
      pubKeyHash: 0x1cb8,
      scriptHash: 0x1cbd,
      wif: 0x80,
      // This parameter was introduced in version 3 to allow soft forks, for version 1 and 2 transactions we add a
      // dummy value.
      consensusBranchId: {
        1: 0x00,
        2: 0x00,
        3: 0x5ba81b19,
        // 4: 0x76b809bb (old Sapling branch id). Blossom branch id becomes effective after block 653600
        // 4: 0x2bb40e60
        // 4: 0xf5b9230b (Heartwood branch id, see https://zips.z.cash/zip-0250)
        4: 0xe9ff75a6 // (Canopy branch id, see https://zips.z.cash/zip-0251)
      },
      coin: 'zec'
    },
    test: {
      messagePrefix: '\x18ZCash Signed Message:\n',
      bip32: getDefaultBip32Testnet(),
      pubKeyHash: 0x1d25,
      scriptHash: 0x1cba,
      wif: 0xef,
      consensusBranchId: {
        1: 0x00,
        2: 0x00,
        3: 0x5ba81b19,
        // 4: 0x76b809bb (old Sapling branch id)
        // 4: 0x2bb40e60
        // 4: 0xf5b9230b (Heartwood branch id, see https://zips.z.cash/zip-0250)
        4: 0xe9ff75a6 // (Canopy branch id, see https://zips.z.cash/zip-0251)
      },
      coin: 'zec'
    },
  },
}
