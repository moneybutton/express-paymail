/* global def, get */
import * as helpers from '../src/script-helpers'
import { expect } from 'chai'

describe('script helpers', () => {
  describe('p2pkhFromAddress', () => {
    // Private key: L1j8ZEvpxWMDQ3zYih4MgxABfvEvjoPYEM4THLEBUUr35tNKyVhP
    def('address', () => '1H3fJFqzQafPWiuWG5hRrt5hvqBRYYfpeK')

    it('creates the right script', () => {
      const result = helpers.p2pkhFromAddress(get.address)
      expect(result).to.be.equal('76a914b002d0497100a7bf72251a8a0185092c00240e1f88ac')
    })
  })

  describe('p2pkhFromPublicKey', () => {
    // Private key: L1j8ZEvpxWMDQ3zYih4MgxABfvEvjoPYEM4THLEBUUr35tNKyVhP
    def('pubkey', () => '03908e94c48ababa9161897af2d8a6cf54ad82def436a7734b1da4d48e5fe99521')
    it('creates the right script', () => {
      const result = helpers.p2pkhFromPublicKey(get.pubkey)
      expect(result).to.be.equal('76a914b002d0497100a7bf72251a8a0185092c00240e1f88ac')
    })
  })
})
