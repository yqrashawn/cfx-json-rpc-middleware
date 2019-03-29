const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const createScaffoldMiddleware = require('json-rpc-engine/src/createScaffoldMiddleware')
const sigUtil = require('eth-sig-util')
const namehash = require('eth-ens-namehash')

module.exports = createAppKeyMiddleware


// No end in createAsyncMiddleware ?
//I would ask @aaron.davis if that’s right. I usually use the explicit `done()` call (4th param).
//I think the nonce may be unique since it’s recording the pending nonce but also allowing other middleware methods to run?

// Create only one with switch statement
// impose here path parameter depending on origin
//make sure that origin can not be faked

function createAppKeyMiddleware (appKey_eth_getPublicKey,
				 appKey_eth_getAddress,
				 appKey_eth_signTransaction,
				 appKey_eth_signTypedMessage) {
  return createScaffoldMiddleware({
    'appKey_eth_getPublicKey': createAsyncMiddleware(appKeyEthGetPublicKey),
    'appKey_eth_getAddress': createAsyncMiddleware(appKeyEthGetAddress),
    'appKey_eth_signTransaction': createAsyncMiddleware(appKeyEthSignTransaction),
    'appKey_eth_signTypedMessage': createAsyncMiddleware(appKeyEthSignTypedMessage),    
  })

  function prepareHdPath(personaPath, origin, hdSubPath){
    // beginning of Path using BIP 43 and arachnid eth subpurpose space
    // Would prefer to use m/BIPNUMBER' once the app key eip is submitted as a bip
    const beginningPath = "m/43'/60'/1775'"
    const uid = namehash.hash(origin)
    const uidSubPath = splitUid(uid)
    const hdPath = beginningPath + "/" + personaPath + "/" + uidSubPath +"/"  + hdSubPath
    return hdPath
  }

  // e4a10c258c7b68c38df1cf0caf03ce2e34b5ec02e5abdd3ef18f0703f317c62a
  // e4a1/0c25/8c7b/68c3/8df1/cf0c/af03/ce2e/34b5/ec02/e5ab/dd3e/f18f/0703/f317/c62a
  // m/14249/25189/12235/29994/58227/65200/8925/10370/43316/35705

  // should be reworked to split in 8 times 31bits (can not be done with hex slicing)
  // + 1 times 8 bits
  // to reduce HD tree depth
  
  function splitUid(uid) {
    let numberOfSlices = 16
    let subPath = ""
    for (let k = 0; k < numberOfSlices; k++) {

      subPath  += parseInt(uid.slice(4*k+2, 4*(k+1)+2), 16)
      if (k != numberOfSlices - 1) {
	subPath += "'/"
      }
      if (k == numberOfSlices - 1) {
	subPath += "'"	
      }
    }
    return subPath
  }

  
  async function appKeyEthGetPublicKey(req, res) {
    const hdSubPath = req.params
    const personaPath = "0'"
    const hdPath = prepareHdPath(personaPath, req.origin, hdSubPath)
    res.result = await appKey_eth_getPublicKey(hdPath)
  }
  async function appKeyEthGetAddress(req, res) {
    res.result = await appKey_eth_getAddress(req.params)
  }
  async function appKeyEthSignTransaction(req, res) {
    const fromAddress = req.params[0]
    const txParams = req.params[1]
    res.result = await appKey_eth_signTransaction(fromAddress, txParams)
  }
  async function appKeyEthSignTypedMessage(req, res) {
    const fromAddress = req.params[0]
    const txParams = req.params[1]
    res.result = await appKey_eth_signTypedMessage(fromAddress, txParams)
  }

}


// function createWalletMiddleware(opts = {}) {
//   // parse + validate options
//   const getAccounts = opts.getAccounts
//   const processTypedMessage = opts.processTypedMessage
//   const processTypedMessageV0 = opts.processTypedMessageV0
//   const processTypedMessageV3 = opts.processTypedMessageV3
//   const processPersonalMessage = opts.processPersonalMessage
//   const processEthSignMessage = opts.processEthSignMessage
//   const processTransaction = opts.processTransaction

//   return createScaffoldMiddleware({
//     // account lookups
//     'eth_accounts': createAsyncMiddleware(lookupAccounts),
//     'eth_coinbase': createAsyncMiddleware(lookupDefaultAccount),
//     // tx signatures
//     'eth_sendTransaction': createAsyncMiddleware(sendTransaction),
//     // message signatures
//     'eth_sign': createAsyncMiddleware(ethSign),
//     'eth_signTypedData': createAsyncMiddleware(signTypedData),
//     'eth_signTypedData_v0': createAsyncMiddleware(signTypedDataV0),
//     'eth_signTypedData_v3': createAsyncMiddleware(signTypedDataV3),
//     'personal_sign': createAsyncMiddleware(personalSign),
//     'personal_ecRecover': createAsyncMiddleware(personalRecover),
//   })

//   //
//   // account lookups
//   //

//   async function lookupAccounts(req, res) {
//     if (!getAccounts) throw new Error('WalletMiddleware - opts.getAccounts not provided')
//     const accounts = await getAccounts(req)
//     res.result = accounts
//   }

//   async function lookupDefaultAccount(req, res) {
//     if (!getAccounts) throw new Error('WalletMiddleware - opts.getAccounts not provided')
//     const accounts = await getAccounts(req)
//     res.result = accounts[0] || null
//   }

//   //
//   // transaction signatures
//   //

//   async function sendTransaction(req, res) {
//     if (!processTransaction) throw new Error('WalletMiddleware - opts.processTransaction not provided')
//     const txParams = req.params[0] || {}
//     await validateSender(txParams.from, req)
//     res.result = await processTransaction(txParams, req)
//   }

//   //
//   // message signatures
//   //

//   async function ethSign(req, res) {
//     if (!processEthSignMessage) throw new Error('WalletMiddleware - opts.processEthSignMessage not provided')
//     // process normally
//     const address = req.params[0]
//     const message = req.params[1]
//     // non-standard "extraParams" to be appended to our "msgParams" obj
//     const extraParams = req.params[2] || {}
//     const msgParams = Object.assign({}, extraParams, {
//       from: address,
//       data: message,
//     })

//     await validateSender(address, req)
//     res.result = await processEthSignMessage(msgParams, req)
//   }

//   async function signTypedData (req, res) {
//     if (!processTypedMessage) throw new Error('WalletMiddleware - opts.processTypedMessage not provided')
//     const from = req.from
//     const message = req.params[0]
//     const address = req.params[1]
//     const version = 'V1'
//     const extraParams = req.params[2] || {}
//     const msgParams = Object.assign({}, extraParams, {
//       from: address,
//       data: message,
//     })

//     await validateSender(address, req)
//     await validateSender(from, req)
//     res.result = await processTypedMessage(msgParams, req, version)
//   }

//   async function signTypedDataV0 (req, res) {
//     if (!processTypedMessageV0) throw new Error('WalletMiddleware - opts.processTypedMessage not provided')
//     const from = req.from
//     const message = req.params[1]
//     const address = req.params[0]
//     const version = 'V0'
//     await validateSender(address, req)
//     await validateSender(from, req)
//     const msgParams = {
//       data: message,
//       from: address,
//       version
//     }
//     res.result = await processTypedMessageV0(msgParams, req, version)
//   }

//   async function signTypedDataV3 (req, res) {
//     if (!processTypedMessageV3) throw new Error('WalletMiddleware - opts.processTypedMessage not provided')
//     const from = req.from
//     const message = req.params[1]
//     const address = req.params[0]
//     const version = 'V3'
//     await validateSender(address, req)
//     await validateSender(from, req)
//     const msgParams = {
//       data: message,
//       from: address,
//       version
//     }
//     res.result = await processTypedMessageV3(msgParams, req, version)
//   }

//   async function personalSign (req, res) {
//     if (!processPersonalMessage) throw new Error('WalletMiddleware - opts.processPersonalMessage not provided')
//     // process normally
//     const firstParam = req.params[0]
//     const secondParam = req.params[1]
//     // non-standard "extraParams" to be appended to our "msgParams" obj
//     const extraParams = req.params[2] || {}

//     // We initially incorrectly ordered these parameters.
//     // To gracefully respect users who adopted this API early,
//     // we are currently gracefully recovering from the wrong param order
//     // when it is clearly identifiable.
//     //
//     // That means when the first param is definitely an address,
//     // and the second param is definitely not, but is hex.
//     if (resemblesAddress(firstParam) && !resemblesAddress(secondParam)) {
//       let warning = `The eth_personalSign method requires params ordered `
//       warning += `[message, address]. This was previously handled incorrectly, `
//       warning += `and has been corrected automatically. `
//       warning += `Please switch this param order for smooth behavior in the future.`
//       res.warning = warning

//       address = firstParam
//       message = secondParam
//     } else {
//       message = firstParam
//       address = secondParam
//     }

//     const msgParams = Object.assign({}, extraParams, {
//       from: address,
//       data: message,
//     })

//     await validateSender(address, req)
//     res.result = await processPersonalMessage(msgParams, req)
//   }

//   async function personalRecover(req, res) {
//     const message = req.params[0]
//     const signature = req.params[1]
//     // non-standard "extraParams" to be appended to our "msgParams" obj
//     const extraParams = req.params[2] || {}
//     const msgParams = Object.assign({}, extraParams, {
//       sig: signature,
//       data: message,
//     })

//     const senderHex = sigUtil.recoverPersonalSignature(msgParams)
//     res.result = senderHex
//   }

//   //
//   // utility
//   //

//   async function validateSender(address, req) {
//     // allow unspecified address (allow transaction signer to insert default)
//     if (!address) return
//     // ensure address is included in provided accounts
//     if (!getAccounts) throw new Error('WalletMiddleware - opts.getAccounts not provided')
//     const accounts = await getAccounts(req)
//     const normalizedAccounts = accounts.map(address => address.toLowerCase())
//     const normalizedAddress =  address.toLowerCase()
//     if (!normalizedAccounts.includes(normalizedAddress)) throw new Error('WalletMiddleware - Invalid "from" address.')
//   }

// }

// function resemblesAddress (string) {
//   // hex prefix 2 + 20 bytes
//   return string.length === (2 + 20 * 2)
// }
