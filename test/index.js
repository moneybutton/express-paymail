/* global def, get */
/* eslint no-unused-expressions: 0 */
import { buildRouter } from '../src'
import { expect } from 'chai'
import express from 'express'
import request from 'supertest'
import HttpStatus from 'http-status-codes'
import { MockPaymailClient } from './utils/MockPaymailClient'

describe('.well-known file', () => {
  let app = null
  def('paymailClient', () => new MockPaymailClient())
  def('getIdentityKey', () => null)
  def('getPaymentDestination', () => null)
  def('verifyPublicKeyOwner', () => null)
  def('mainUrl', () => 'https://example.org')
  def('requestSenderValidation', () => true)
  def('config', () => ({
    basePath: '/base-route',
    getIdentityKey: get.getIdentityKey,
    getPaymentDestination: get.getPaymentDestination,
    verifyPublicKeyOwner: get.verifyPublicKeyOwner,
    requestSenderValidation: get.requestSenderValidation
  }))

  beforeEach(() => {
    app = express()
    const paymailRouter = buildRouter(get.mainUrl, {
      ...get.config,
      paymailClient: get.paymailClient
    })

    app.use(paymailRouter)
  })

  describe('errorHandler', () => {
    def('getIdentityKey', () => async () => { throw new Error('Ooops!') })

    describe('default', () => {
      def('config', () => ({
        basePath: '/base-route',
        getIdentityKey: get.getIdentityKey,
      }))

      it('returns default error', async () => {
        const response = await request(app)
          .get('/base-route/id/name@domain.com')

        expect(response.body).to.be.eql({
          code: 'internal-server-error',
          message: 'Something went wrong. Please try again later'
        })
      })
    })

    describe('custom eror handler', () => {
      def('config', () => ({
        basePath: '/base-route',
        getIdentityKey: get.getIdentityKey,
        errorHandler: (err, req, res, next) => {
          res.send({message: err.message})
        }
      }))

      it('returns custom error', async () => {
        const response = await request(app)
          .get('/base-route/id/name@domain.com')

        expect(response.body).to.be.eql({message: 'Ooops!'})
      })
    })
  })

  describe('cors', () => {
    describe('default', () => {
      it('returns no content status', async () => {
        await request(app)
          .options('/.well-known/bsvalias')
          .expect(HttpStatus.NO_CONTENT)
      })

      it('returns right headers', async () => {
        await request(app)
          .options('/.well-known/bsvalias')
          .expect(res => {
            expect(res.headers['access-control-allow-origin']).to.be.eql('*')
            expect(res.headers['access-control-allow-methods']).to.be.eql('GET,HEAD,PUT,PATCH,POST,DELETE')
          })
      })
    })

    describe('not cors', () => {
      def('config', () => ({
        useCors: false
      }))

      it('returns no content status', async () => {
        await request(app)
          .options('/.well-known/bsvalias')
          .expect(res => {
            const headers = Object.keys(res.headers)
            expect(headers).not.to.contain('access-control-allow-origin')
            expect(headers).not.to.contain('access-control-allow-methods')
          })
      })
    })

    describe('custom cors config', () => {
      def('config', () => ({
        useCors: true,
        corsConfig: {
          methods: 'GET',
          origin: 'someorigin.com',
          optionsSuccessStatus: 200
        }
      }))

      it('returns the configured status', async () => {
        await request(app)
          .options('/.well-known/bsvalias')
          .expect(HttpStatus.OK)
      })

      it('returns right headers', async () => {
        await request(app)
          .options('/.well-known/bsvalias')
          .expect(res => {
            expect(res.headers['access-control-allow-origin']).to.be.eql('someorigin.com')
            expect(res.headers['access-control-allow-methods']).to.be.eql('GET')
          })
      })
    })
  })

  describe('mainUrl parameter', () => {
    it('fails if the base url is not valid', () => {
      const baseUrl = 'someInvalidUrl'
      expect(() => buildRouter(baseUrl, {
        ...get.config,
        paymailClient: get.paymailClient
      })).to.throw()
    })
  })

  describe('.well-known/bsvalias', () => {
    it('returns a json', async () => {
      await request(app)
        .get('/.well-known/bsvalias')
        .expect('Content-Type', /json/)
    })

    it('returns ok status', async () => {
      await request(app)
        .get('/.well-known/bsvalias')
        .expect(HttpStatus.OK)
    })

    it('retujrns the right version', async () => {
      const response = await request(app)
        .get('/.well-known/bsvalias')

      expect(response.body.bsvalias).to.equals('1.0')
    })

    describe('when the handler for identity is provided', () => {
      def('getIdentityKey', () => (name, domain) => 'some key')

      it('the response contains a value for id endpoint', async () => {
        const response = await request(app)
          .get('/.well-known/bsvalias')

        const body = response.body
        expect(body.capabilities.pki).to.equals('https://example.org/base-route/id/{alias}@{domain.tld}')
      })
    })

    describe('when the handler for identity is not provided', () => {
      def('getIdentityKey', () => undefined)

      it('the response does not contain a value for id endpoint', async () => {
        const response = await request(app)
          .get('/.well-known/bsvalias')

        expect(response.body.capabilities.pki).to.be.undefined
      })
    })

    describe('when the handler for address is provided', () => {
      def('getPaymentDestination', () => (name, domain) => Promise.resolve('some key'))

      it('the response contains a value for address endpoint', async () => {
        const response = await request(app)
          .get('/.well-known/bsvalias')
        const body = response.body
        expect(body.capabilities.paymentDestination).to.equals('https://example.org/base-route/address/{alias}@{domain.tld}')
      })
    })

    describe('when the handler for address is not provided', () => {
      def('getPaymentDestination', () => undefined)

      it('the response does not contain a value for address endpoint', async () => {
        const response = await request(app)
          .get('/.well-known/bsvalias')

        expect(response.body.paymentDestination).to.be.undefined
      })
    })

    describe('when the handler for verify pubkey owner is defined', () => {
      def('verifyPublicKeyOwner', () => (name, domain, pubkey) => {
        return true
      })

      it('returns', async () => {
        const response = await request(app)
          .get('/.well-known/bsvalias')

        expect(response.body.capabilities['a9f510c16bde']).to.be.equals('https://example.org/base-route/verifypubkey/{alias}@{domain.tld}/{pubkey}')
      })
    })

    describe('when the handler for verify pubkey owner is not defined', () => {
      def('verifyPublicKeyOwner', () => undefined)

      it('returns', async () => {
        const response = await request(app)
          .get('/.well-known/bsvalias')

        expect(response.body.capabilities['a9f510c16bde']).to.be.undefined
      })
    })

    describe('requestSenderValidation', () => {
      describe('when it is false', () => {
        def('requestSenderValidation', () => false)
        it('returns false in 6745385c3fc0 capability', async () => {
          const response = await request(app)
            .get('/.well-known/bsvalias')
          expect(response.body.capabilities['6745385c3fc0']).to.be.false
        })
      })

      describe('when is true', async () => {
        def('requestSenderValidation', () => true)
        it('returns true in 6745385c3fc0 capability', async () => {
          const response = await request(app)
            .get('/.well-known/bsvalias')
          expect(response.body.capabilities['6745385c3fc0']).to.be.true
        })
      })

      describe('when is not present', async () => {
        def('config', () => ({
          basePath: '/base-route',
          getIdentityKey: get.getIdentityKey,
          getPaymentDestination: get.getPaymentDestination,
          verifyPublicKeyOwner: get.verifyPublicKeyOwner
          // requestSenderValidation: get.requestSenderValidation
        }))
        it('returns true in 6745385c3fc0 capability', async () => {
          it('returns ', async () => {
            const response = await request(app)
              .get('/.well-known/bsvalias')
            expect(response.body.capabilities['6745385c3fc0']).to.be.true
          })
        })
      })
    })
  })
})
