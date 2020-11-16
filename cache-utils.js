const stringify = require('json-stable-stringify')

module.exports = {
  cacheIdentifierForPayload: cacheIdentifierForPayload,
  canCache: canCache,
  blockTagForPayload: blockTagForPayload,
  paramsWithoutBlockTag: paramsWithoutBlockTag,
  blockTagParamIndex: blockTagParamIndex,
  cacheTypeForPayload: cacheTypeForPayload,
}

function cacheIdentifierForPayload(payload, skipBlockRef) {
  const simpleParams = skipBlockRef
    ? paramsWithoutBlockTag(payload)
    : payload.params
  if (canCache(payload)) {
    return payload.method + ':' + stringify(simpleParams)
  } else {
    return null
  }
}

function canCache(payload) {
  return cacheTypeForPayload(payload) !== 'never'
}

function blockTagForPayload(payload) {
  let index = blockTagParamIndex(payload)

  // Block tag param not passed.
  if (index >= payload.params.length) {
    return null
  }

  return payload.params[index]
}

function paramsWithoutBlockTag(payload) {
  const index = blockTagParamIndex(payload)

  // Block tag param not passed.
  if (index >= payload.params.length) {
    return payload.params
  }

  // eth_getBlockByNumber has the block tag first, then the optional includeTx? param
  if (payload.method === 'eth_getBlockByNumber') {
    return payload.params.slice(1)
  }

  return payload.params.slice(0, index)
}

function blockTagParamIndex(payload) {
  switch (payload.method) {
    // blockTag is at index 2
    case 'cfx_getStorageAt':
    case 'eth_getStorageAt':
      return 2
    // blockTag is at index 1
    case 'cfx_getBalance':
    case 'cfx_getCode':
    case 'cfx_getNextNonce':
    case 'cfx_call':
    case 'eth_getBalance':
    case 'eth_getCode':
    case 'eth_getTransactionCount':
    case 'eth_call':
      return 1
    // blockTag is at index 0
    case 'cfx_getBlockByEpochNumber':
    case 'eth_getBlockByNumber':
      return 0
    // there is no blockTag
    default:
      return undefined
  }
}

function cacheTypeForPayload(payload) {
  switch (payload.method) {
    // cache permanently
    case 'web3_clientVersion':
    case 'web3_sha3':
    case 'cfx_protocolVersion':
    case 'cfx_getBlockTransactionCountByHash':
    case 'cfx_getUncleCountByBlockHash':
    case 'cfx_getCode':
    case 'cfx_getBlockByHash':
    case 'cfx_getTransactionByHash':
    case 'cfx_getTransactionByBlockHashAndIndex':
    case 'cfx_getTransactionReceipt':
    case 'cfx_getUncleByBlockHashAndIndex':
    case 'cfx_getCompilers':
    case 'cfx_compileLLL':
    case 'cfx_compileSolidity':
    case 'cfx_compileSerpent':
    case 'eth_protocolVersion':
    case 'eth_getBlockTransactionCountByHash':
    case 'eth_getUncleCountByBlockHash':
    case 'eth_getCode':
    case 'eth_getBlockByHash':
    case 'eth_getTransactionByHash':
    case 'eth_getTransactionByBlockHashAndIndex':
    case 'eth_getTransactionReceipt':
    case 'eth_getUncleByBlockHashAndIndex':
    case 'eth_getCompilers':
    case 'eth_compileLLL':
    case 'eth_compileSolidity':
    case 'eth_compileSerpent':
    case 'shh_version':
    case 'test_permaCache':
      return 'perma'

    // cache until fork
    case 'cfx_getBlockByEpochNumber':
    case 'cfx_getBlockTransactionCountByNumber':
    case 'cfx_getUncleCountByBlockNumber':
    case 'cfx_getTransactionByBlockNumberAndIndex':
    case 'cfx_getUncleByBlockNumberAndIndex':
    case 'eth_getBlockByNumber':
    case 'eth_getBlockTransactionCountByNumber':
    case 'eth_getUncleCountByBlockNumber':
    case 'eth_getTransactionByBlockNumberAndIndex':
    case 'eth_getUncleByBlockNumberAndIndex':
    case 'test_forkCache':
      return 'fork'

    // cache for block
    case 'cfx_gasPrice':
    case 'cfx_epochNumber':
    case 'cfx_getBalance':
    case 'cfx_getStorageAt':
    case 'cfx_getNextNonce':
    case 'cfx_call':
    case 'cfx_estimateGasAndCollateral':
    case 'cfx_getFilterLogs':
    case 'cfx_getLogs':

    case 'eth_gasPrice':
    case 'eth_blockNumber':
    case 'eth_getBalance':
    case 'eth_getStorageAt':
    case 'eth_getTransactionCount':
    case 'eth_call':
    case 'eth_estimateGas':
    case 'eth_getFilterLogs':
    case 'eth_getLogs':
    case 'test_blockCache':
      return 'block'

    // never cache
    case 'net_version':
    case 'net_peerCount':
    case 'net_listening':
    case 'cfx_syncing':
    case 'cfx_sign':
    case 'cfx_coinbase':
    case 'cfx_mining':
    case 'cfx_hashrate':
    case 'cfx_accounts':
    case 'cfx_sendTransaction':
    case 'cfx_sendRawTransaction':
    case 'cfx_newFilter':
    case 'cfx_newBlockFilter':
    case 'cfx_newPendingTransactionFilter':
    case 'cfx_uninstallFilter':
    case 'cfx_getFilterChanges':
    case 'cfx_getWork':
    case 'cfx_submitWork':
    case 'cfx_submitHashrate':
    case 'eth_syncing':
    case 'eth_sign':
    case 'eth_coinbase':
    case 'eth_mining':
    case 'eth_hashrate':
    case 'eth_accounts':
    case 'eth_sendTransaction':
    case 'eth_sendRawTransaction':
    case 'eth_newFilter':
    case 'eth_newBlockFilter':
    case 'eth_newPendingTransactionFilter':
    case 'eth_uninstallFilter':
    case 'eth_getFilterChanges':
    case 'eth_getWork':
    case 'eth_submitWork':
    case 'eth_submitHashrate':
    case 'db_putString':
    case 'db_getString':
    case 'db_putHex':
    case 'db_getHex':
    case 'shh_post':
    case 'shh_newIdentity':
    case 'shh_hasIdentity':
    case 'shh_newGroup':
    case 'shh_addToGroup':
    case 'shh_newFilter':
    case 'shh_uninstallFilter':
    case 'shh_getFilterChanges':
    case 'shh_getMessages':
    case 'test_neverCache':
      return 'never'
  }
}
