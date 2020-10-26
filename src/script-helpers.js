import { Address, PublicKey, Script } from 'bsv'

const p2pkhFromAddress = (addressString) => {
  const address = Address.fromString(addressString)
  return Script.buildPublicKeyHashOut(address).toBuffer().toString('hex')
}

const p2pkhFromPublicKey = (pubkey) => {
  const address = Address.fromPublicKey(PublicKey.fromString(pubkey))
  return p2pkhFromAddress(address.toString())
}

export {
  p2pkhFromAddress,
  p2pkhFromPublicKey
}
