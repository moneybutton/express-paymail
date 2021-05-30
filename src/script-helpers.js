const { Address, PubKey } = require('bsv')

const p2pkhFromAddress = (addressString) => {
  const address = Address.fromString(addressString)
  return address.toTxOutScript().toHex()
}

const p2pkhFromPubKey = (pubkey) => {
  const address = Address.fromPubKey(PubKey.fromString(pubkey))
  return p2pkhFromAddress(address.toString())
}

module.exports = {
  p2pkhFromAddress,
  p2pkhFromPubKey
}
