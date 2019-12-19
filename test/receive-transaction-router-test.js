/* global def, get */
import { buildRouter } from '../src'
import { expect } from 'chai'
import express from 'express'
import request from 'supertest'
import HttpStatus from 'http-status-codes'
import { MockPaymailClient } from './utils/MockPaymailClient'

describe('receive transaction router', () => {
  let app = null
  def('paymailClient', () => new MockPaymailClient())
  def('mainUrl', () => 'https://example.org')
  def('receiveTransaction', () => null)

  def('config', () => null)

  beforeEach(() => {
    app = express()
    const paymailRouter = buildRouter(get.mainUrl, {
      ...get.config,
      paymailClient: get.paymailClient
    })

    app.use(paymailRouter)
  })

  describe('/base-route/receive-transaction/:paymail', async () => {
    describe('when the callback is not defined', () => {
      def('config', () => ({
        basePath: '/base-route',
        receiveTransaction: undefined
      }))

      it('returns http status not found', async () => {
        await request(app)
          .post('/base-route/receive-transaction/name@domain.com')
          .send({})
          .expect(HttpStatus.NOT_FOUND) // The route is not defined.
      })
    })

    describe('when the callback is defined', () => {
      def('config', () => ({
        basePath: '/base-route',
        receiveTransaction: get.receiveTransaction
      }))

      def('receiveTransaction', () => (_local, _domain, _data) => {
        return ['sometxid']
      })

      it('returns http status ok', async () => {
        await request(app)
          .post('/base-route/receive-transaction/name@domain.com')
          .send({
            transactions: [{ hex: 'sometxencodedtx' }],
            metadata: {}
          })
          .expect(HttpStatus.OK)
      })

      it('returns the response of the callback', async () => {
        const response = await request(app)
          .post('/base-route/receive-transaction/name@domain.com')
          .send({
            transactions: [],
            metadata: {}
          })
        expect(response.body).to.be.eql(['sometxid'])
      })

      describe('callback parameters', () => {
        let data = null
        let localPart = null
        let domain = null
        def('receiveTransaction', () => (receivedLocalPart, receivedDomain, receivedData) => {
          localPart = receivedLocalPart
          domain = receivedDomain
          data = receivedData
          return ['sometxid']
        })

        it('receives the right parameters', async () => {
          const transactions = [{ hex: 'hexencodedtx' }]
          const metadata = {
            data1: 'hello',
            data2: 'bye'
          }
          const reference = 'somereference'
          await request(app)
            .post('/base-route/receive-transaction/name@domain.com')
            .send({
              transactions,
              metadata,
              reference
            })
          expect(data).to.be.eql({
            transactions,
            metadata,
            reference
          })
          expect(localPart).to.be.eql('name')
          expect(domain).to.be.eql('domain.com')
        })
      })

      it('returns BAD_REQUEST when the transactions are missing', async () => {
        await request(app)
          .post('/base-route/receive-transaction/name@domain.com')
          .send({
            transactions: undefined,
            metadata: {},
            reference: 'someid'
          })
          .expect(HttpStatus.BAD_REQUEST)
      })

      it('returns BAD_REQUEST when metadata is missing', async () => {
        await request(app)
          .post('/base-route/receive-transaction/name@domain.com')
          .send({
            transactions: [],
            metadata: undefined,
            reference: 'someid'
          })
          .expect(HttpStatus.BAD_REQUEST)
      })

      it('returns OK when refference is missing', async () => {
        await request(app)
          .post('/base-route/receive-transaction/name@domain.com')
          .send({
            transactions: [],
            metadata: {},
            reference: undefined
          })
          .expect(HttpStatus.OK)
      })

      it('returns BAD_REQUEST if any transaction object does not have hex attribute', async () => {
        await request(app)
          .post('/base-route/receive-transaction/name@domain.com')
          .send({
            transactions: [
              {
                hex: '0200000001831db7cbb5d97f2e97d2017fe6167b00099d33639d00c7993'
              },
              {
                rawtx: '1483e994e708e4709696b82b5b7f2525a329ed5fa888ac00000000'
              }
            ],
            metadata: {},
            reference: 'someid'
          })
          .expect(HttpStatus.BAD_REQUEST)
      })

      it('returns BAD_REQUEST if any transaction object does has extra attributes', async () => {
        await request(app)
          .post('/base-route/receive-transaction/name@domain.com')
          .send({
            transactions: [
              {
                hex: '0200000001831db7cbb5d97f2e97d2017fe6167b00099d33639d00c7993'
              },
              {
                hex: '1483e994e708e4709696b82b5b7f2525a329ed5fa888ac00000000',
                extra: 'something'
              }
            ],
            metadata: {},
            reference: 'someid'
          })
          .expect(HttpStatus.BAD_REQUEST)
      })

      describe('but throws an error', () => {
        def('receiveTransaction', () => () => {
          throw new Error('error message')
        })

        it('returns INTERNAL_SERVER_ERROR status', async () => {
          await request(app)
            .post('/base-route/receive-transaction/name@domain.com')
            .send({
              transactions: [],
              metadata: {}
            })
            .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        })

        it('returns proper error body', async () => {
          const response = await request(app)
            .post('/base-route/receive-transaction/name@domain.com')
            .send({
              transactions: [],
              metadata: {}
            })
          expect(response.body).to.be.eql({
            code: 'internal-server-error',
            message: 'Something went wrong. Please try again later'
          })
        })
      })

      describe('but it returns null', () => {
        def('receiveTransaction', () => () => {
          return null
        })

        it('returns NOT_FOUND status', async () => {
          await request(app)
            .post('/base-route/receive-transaction/name@domain.com')
            .send({
              transactions: [{ hex: 'somerawtx' }],
              metadata: {}
            })
            .expect(HttpStatus.NOT_FOUND)
        })

        it('returns proper error body', async () => {
          const response = await request(app)
            .post('/base-route/receive-transaction/name@domain.com')
            .send({
              transactions: [{ hex: 'somwrawtx' }],
              metadata: {}
            })
          expect(response.body).to.be.eql({
            code: 'not-found',
            message: 'Paymail not found.'
          })
        })
      })
    })
  })
})
