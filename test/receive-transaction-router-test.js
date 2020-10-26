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
        return 'sometxid'
      })

      it('returns http status ok', async () => {
        await request(app)
          .post('/base-route/receive-transaction/name@domain.com')
          .send({ hex: 'sometxencodedtx', metadata: {} })
          .expect(HttpStatus.OK)
      })

      it('returns the response of the callback', async () => {
        const response = await request(app)
          .post('/base-route/receive-transaction/name@domain.com')
          .send({
            hex: 'somehex',
            metadata: {}
          })
        expect(response.body).to.be.eql({ txid: 'sometxid', message: 'ok' })
      })

      describe('callback parameters', () => {
        let localPart = null
        let domain = null
        let hexTx = null
        let metadata = null
        let reference = null
        def('receiveTransaction', () => (receivedLocalPart, receivedDomain, receivedHexTx, receivedReference, receivedMetadata) => {
          localPart = receivedLocalPart
          domain = receivedDomain
          hexTx = receivedHexTx
          metadata = receivedMetadata
          reference = receivedReference
          return 'sometxid'
        })

        it('receives the right parameters', async () => {
          const transaction = 'hexencodedtx'
          const extraData = {
            data1: 'hello',
            data2: 'bye'
          }
          await request(app)
            .post('/base-route/receive-transaction/name@domain.com')
            .send({
              hex: transaction,
              metadata: extraData,
              reference: 'someRef'
            })
          expect(localPart).to.be.eql('name')
          expect(domain).to.be.eql('domain.com')
          expect(hexTx).to.be.eql(transaction)
          expect(metadata).to.be.eql(extraData)
          expect(reference).to.be.eql('someRef')
        })
      })

      it('returns BAD_REQUEST when the transactions are missing', async () => {
        await request(app)
          .post('/base-route/receive-transaction/name@domain.com')
          .send({
            hex: undefined,
            metadata: {}
          })
          .expect(HttpStatus.BAD_REQUEST)
      })

      it('returns BAD_REQUEST when metadata is missing', async () => {
        await request(app)
          .post('/base-route/receive-transaction/name@domain.com')
          .send({
            hex: 'asdasds',
            metadata: undefined
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
              hex: 'asdads',
              metadata: {}
            })
            .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        })

        it('returns proper error body', async () => {
          const response = await request(app)
            .post('/base-route/receive-transaction/name@domain.com')
            .send({
              hex: 'asdasd',
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
              hex: 'somerawtx',
              metadata: {}
            })
            .expect(HttpStatus.NOT_FOUND)
        })

        it('returns proper error body', async () => {
          const response = await request(app)
            .post('/base-route/receive-transaction/name@domain.com')
            .send({
              hex: 'somwrawtx',
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
