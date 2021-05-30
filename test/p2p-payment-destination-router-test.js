/* global def, get */
const { buildRouter } = require('../src')
const { expect } = require('chai')
const express = require('express')
const request = require('supertest')
const HttpStatus = require('http-status-codes')
const { MockPaymailClient } = require('./utils/MockPaymailClient')

describe('users', () => {
  let app = null
  def('paymailClient', () => new MockPaymailClient())
  def('getIdentityKey', () => null)
  def('getP2pPaymentDestination', () => null)
  def('mainUrl', () => 'https://example.org')
  def('requestSenderValidation', () => true)
  def('config', () => ({
    basePath: '/base-route',
    getIdentityKey: get.getIdentityKey,
    getP2pPaymentDestination: get.getP2pPaymentDestination,
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

  describe('/base-route/p2p-payment-destination/:paymail', async () => {
    describe('when the handler is not defined', async () => {
      def('getP2pPaymentDestination', () => undefined)

      it('returns not found status', async () => {
        await request(app)
          .post('/base-route/p2p-payment-destination/name@domain.com')
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    describe('when the handler is defined', async () => {
      def('callRegister', () => [])
      def('aPaymentDestination', () => ({
        outputs: [
          {
            output: 'some address',
            satoshis: 1000
          },
          {
            output: 'other address',
            satoshis: 3000
          }
        ],
        reference: 'someref'
      }))

      def('getP2pPaymentDestination', () => (name, domain, satoshis) => {
        get.callRegister.push({ name, domain, satoshis })
        return Promise.resolve(get.aPaymentDestination)
      })

      // private key: KxWjJiTRSA7oExnvbWRaCizYB42XMKPxyD6ryzANbdXCJw1fo4sR
      def('requestBody', () => ({
        satoshis: 4000
      }))

      it('returns ok', async () => {
        await request(app)
          .post('/base-route/p2p-payment-destination/name@domain.com')
          .send(get.requestBody)
          .expect(HttpStatus.OK)
      })

      it('a list with the correct format', async () => {
        const response = await request(app)
          .post('/base-route/p2p-payment-destination/name@domain.com')
          .send(get.requestBody)

        expect(response.body).to.be.eql(get.aPaymentDestination)
      })

      describe('when the handler returns null', () => {
        def('getP2pPaymentDestination', () => () => null)
        it('returns the output script', async () => {
          const response = await request(app)
            .post('/base-route/p2p-payment-destination/name@domain.com')
            .send(get.requestBody)

          expect(response.status).to.be.equal(HttpStatus.NOT_FOUND)
        })
      })

      describe('when the handler returns no reference', () => {
        def('getP2pPaymentDestination', () => () => ({
          outputs: [
            {
              output: 'some address',
              satoshis: 1000
            },
            {
              output: 'other address',
              satoshis: 3000
            }
          ]
          // reference: 'someref'
        }))

        it('returns error status', async () => {
          const response = await request(app)
            .post('/base-route/p2p-payment-destination/name@domain.com')
            .send(get.requestBody)

          expect(response.status).to.be.equal(HttpStatus.INTERNAL_SERVER_ERROR)
        })
      })

      describe('callback call', () => {
        def('callsReceived', () => [])
        def('getP2pPaymentDestination', () => (name, domain, satoshis) => {
          get.callsReceived.push({ name, domain, satoshis })
        })

        it('calls the callback only once', async () => {
          await request(app)
            .post('/base-route/p2p-payment-destination/name@domain.com')
            .send(get.requestBody)

          expect(get.callsReceived.length).to.be.eq(1)
        })

        it('gets call with right name and domain', async () => {
          await request(app)
            .post('/base-route/p2p-payment-destination/name@domain.com')
            .send(get.requestBody)

          const call = get.callsReceived[0]
          expect(call.name).to.be.eq('name')
          expect(call.domain).to.be.eq('domain.com')
          expect(call.satoshis).to.be.eq(4000)
        })
      })

      describe('content type header', async () => {
        it('fails when is wrong', async () => {
          const response = await request(app)
            .post('/base-route/p2p-payment-destination/name@domain.com')
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(JSON.stringify(get.requestBody))

          expect(response.status).to.be.equal(HttpStatus.BAD_REQUEST)
          expect(response.body.code).to.be.equal('wrong-content-type')
        })
      })

      const neededParameters = [
        {
          name: 'satoshis',
          errorCode: 'missing-satoshis',
          errorMessage: '"satoshis" parameter is missing'
        }
      ]

      neededParameters.forEach(({ name, errorCode, errorMessage }) => {
        describe(`when ${name} is missing`, async () => {
          it('returns bad request', async () => {
            const { [name]: value, ...filteredBody } = get.requestBody
            await request(app)
              .post('/base-route/p2p-payment-destination/name@domain.com')
              .send(filteredBody)
              .expect(HttpStatus.BAD_REQUEST)
          })

          it('error description', async () => {
            const { [name]: value, ...filteredBody } = get.requestBody
            const response = await request(app)
              .post('/base-route/p2p-payment-destination/name@domain.com')
              .send(filteredBody)

            expect(response.body).to.be.eql({
              code: errorCode,
              message: errorMessage
            })
          })
        })
      })
    })
  })
})
