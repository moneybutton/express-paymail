/* global def, get */
import { buildRouter } from '../src'
import { expect } from 'chai'
import express from 'express'
import request from 'supertest'
import HttpStatus from 'http-status-codes'
import { MockPaymailClient } from './utils/MockPaymailClient'

describe('users', () => {
  let app = null
  def('paymailClient', () => new MockPaymailClient())
  def('getIdentityKey', () => null)
  def('getPaymentDestination', () => null)
  def('mainUrl', () => 'https://example.org')
  def('config', () => ({
    basePath: '/base-route',
    getIdentityKey: get.getIdentityKey,
    getPaymentDestination: get.getPaymentDestination
  }))

  beforeEach(() => {
    app = express()
    const paymailRouter = buildRouter(get.mainUrl, {
      ...get.config,
      paymailClient: get.paymailClient
    })

    app.use(paymailRouter)
  })

  describe('/base-route/id/:paymail', async () => {
    describe('when no handler is not provided.', async () => {
      def('getIdentityKey', () => null)

      it('returns 404', async () => {
        await request(app)
          .get('/base-route/id/name@domain.com')
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    describe('when the handler is provided', () => {
      def('callRegister', () => [])
      def('identityKeyValue', () => 'some key')
      def('getIdentityKey', () => (name, domain) => {
        get.callRegister.push({ name, domain })
        return get.identityKeyValue
      })

      it('returns ok', async () => {
        await request(app)
          .get('/base-route/id/name@domain.com')
          .expect(HttpStatus.OK)
      })

      it('returns correct answer format', async () => {
        const response = await request(app)
          .get('/base-route/id/name@domain.com')

        expect(response.body).to.be.eql({
          bsvalias: '1.0',
          handle: 'name@domain.com',
          pubkey: get.identityKeyValue
        })
      })

      it('sends the right parameters to the handler', async () => {
        await request(app)
          .get('/base-route/id/name@domain.com')

        expect(get.callRegister).to.be.eql([{ name: 'name', domain: 'domain.com' }])
      })

      describe('when the handler fails', async () => {
        def('getIdentityKey', () => (name, domain) => {
          throw new Error('something went wrong')
        })

        it('returns internal server error', async () => {
          await request(app)
            .get('/base-route/id/name@domain.com')
            .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        })

        it('returns detailed body', async () => {
          const response = await request(app)
            .get('/base-route/id/name@domain.com')

          expect(response.body).to.be.eql({
            code: 'internal-server-error',
            message: 'Something went wrong. Please try again later'
          })
        })
      })

      describe('when the handler returns null', async () => {
        def('getIdentityKey', () => (name, domain) => null)

        it('returns not found status', async () => {
          await request(app)
            .get('/base-route/id/name@domain.com')
            .expect(HttpStatus.NOT_FOUND)
        })

        it('returns detailed body', async () => {
          const response = await request(app)
            .get('/base-route/id/name@domain.com')

          expect(response.body).to.be.eql({
            code: 'not-found',
            message: 'Paymail not found: name@domain.com'
          })
        })
      })
    })
  })
})
