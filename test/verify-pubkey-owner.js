/* global def, get */
/* eslint no-unused-expressions: 0 */
import { buildRouter } from '../src'
import { expect } from 'chai'
import express from 'express'
import request from 'supertest'
import HttpStatus from 'http-status-codes'
import { MockPaymailClient } from './utils/MockPaymailClient'

describe('verify pubkey owner router', () => {
  let app = null
  def('paymailClient', () => new MockPaymailClient())
  def('mainUrl', () => 'https://example.org')
  def('verifyPublicKeyOwner', () => () => true)
  def('config', () => ({
    basePath: '/base-route',
    verifyPublicKeyOwner: get.verifyPublicKeyOwner
  }))

  def('aPaymail', () => 'some@paymail.org')

  // Private key: L4HeDPHa4fXARArwzF85oV2zRQFDAsUkFDA5XrS3rCz8GPGSNAHu
  def('aPubkey', () => '030729634f320eb644e21c8b4126b894720bc2d65cd799f4137e0039d7fc071861')

  def('route', () => `/base-route/verifypubkey/${get.aPaymail}/${get.aPubkey}`)

  beforeEach(() => {
    app = express()
    const paymailRouter = buildRouter(get.mainUrl, {
      ...get.config,
      paymailClient: get.paymailClient
    })

    app.use(paymailRouter)
  })

  describe('/base-route/verifypubkey/:paymail/:pubkey', async () => {
    describe('when the handler is not defined', async () => {
      def('verifyPublicKeyOwner', () => undefined)

      it('returns not found status', async () => {
        await request(app)
          .get(get.route)
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    describe('when the handler is defined', async () => {
      def('verifyPublicKeyOwner', () => () => {
        return Promise.resolve(true)
      })

      it('returns ok', async () => {
        await request(app)
          .get(get.route)
          .expect(HttpStatus.OK)
      })

      it('returns correct body structure', async () => {
        const response = await request(app).get(get.route)
        expect(response.body).to.have.keys('bsvalias', 'handle', 'pubkey', 'match')
      })

      it('returns correct body content', async () => {
        const response = await request(app).get(get.route)
        expect(response.body.bsvalias).to.be.equal('1.0')
        expect(response.body.handle).to.be.equal(get.aPaymail)
        expect(response.body.pubkey).to.be.equal(get.aPubkey)
        expect(response.body.match).to.be.equal(true)
      })

      describe('callback call', () => {
        def('callRegister', () => [])
        def('verifyPublicKeyOwner', () => (name, domain, pubkey) => {
          get.callRegister.push({ name, domain, pubkey })
          return Promise.resolve(true)
        })

        it('calls the callback', async () => {
          await request(app)
            .get(get.route)

          expect(get.callRegister.length).to.be.equal(1)
        })

        it('calls with the right paremeters', async () => {
          await request(app)
            .get(get.route)

          expect(get.callRegister[0]).to.be.eql({
            name: 'some',
            domain: 'paymail.org',
            pubkey: get.aPubkey
          })
        })
      })

      describe('callback response', async () => {
        def('callbackResponse', () => null)
        def('verifyPublicKeyOwner', () => (name, domain, pubkey) => {
          return get.callbackResponse
        })

        describe('when the callback response is true', async () => {
          def('callbackResponse', () => true)
          it('uses true', async () => {
            const response = await request(app).get(get.route)

            expect(response.body.match).to.be.true
          })
        })

        describe('when the callback response is false', async () => {
          def('callbackResponse', () => false)
          it('uses false', async () => {
            const response = await request(app).get(get.route)

            expect(response.body.match).to.be.false
          })
        })

        describe('when the callback response is null', async () => {
          def('callbackResponse', () => null)
          it('uses false', async () => {
            const response = await request(app).get(get.route)

            expect(response.body.match).to.be.false
          })
        })

        describe('when the callback response is undefined', async () => {
          def('callbackResponse', () => undefined)
          it('uses false', async () => {
            const response = await request(app).get(get.route)

            expect(response.body.match).to.be.false
          })
        })

        describe('when the callback response is falsey', async () => {
          def('callbackResponse', () => '')
          it('uses false', async () => {
            const response = await request(app).get(get.route)

            expect(response.body.match).to.be.false
          })
        })

        describe('when the callback response is thruty', async () => {
          def('callbackResponse', () => [])
          it('uses false', async () => {
            const response = await request(app).get(get.route)

            expect(response.body.match).to.be.true
          })
        })
      })
    })
  })
})
