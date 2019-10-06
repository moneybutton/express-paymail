/* global def, get */
import { buildRouter } from '../src'
import { expect } from 'chai'
import express from 'express'
import request from 'supertest'
import HttpStatus from 'http-status-codes'
import { MockPaymailClient } from './utils/MockPaymailClient'
import moment from 'moment'

describe('users', () => {
  let app = null
  def('paymailClient', () => new MockPaymailClient())
  def('getIdentityKey', () => null)
  def('getPaymentDestination', () => null)
  def('mainUrl', () => 'https://example.org')
  def('requestSenderValidation', () => true)
  def('config', () => ({
    basePath: '/base-route',
    getIdentityKey: get.getIdentityKey,
    getPaymentDestination: get.getPaymentDestination,
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

  describe('/base-route/address/:paymail', async () => {
    describe('when the handler is not defined', async () => {
      def('getPaymentDestination', () => undefined)

      it('returns not found status', async () => {
        await request(app)
          .post('/base-route/address/name@domain.com')
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    describe('when the handler is defined', async () => {
      def('callRegister', () => [])
      def('anOutputScript', () => 'some address')
      def('getPaymentDestination', () => (name, domain) => {
        get.callRegister.push({ name, domain })
        return Promise.resolve(get.anOutputScript)
      })

      def('aDatetime', () => moment('2019-03-01').toISOString())

      // private key: KxWjJiTRSA7oExnvbWRaCizYB42XMKPxyD6ryzANbdXCJw1fo4sR
      def('requestBody', () => ({
        senderName: 'FirstName LastName',
        senderHandle: 'principal@domain.tld',
        dt: get.aDatetime,
        amount: 500,
        purpose: 'human readable description',
        signature: 'H35/3nzocVWb2U5dAyIsLWQEEQ3VL2EXSvSyoH4NcEh6fbIzPa79LL1Au04c1mUdeSTolsDgs8bWBljXHMSYRc8='
      }))

      beforeEach(() => {
        get.paymailClient.setValidSignature('H35/3nzocVWb2U5dAyIsLWQEEQ3VL2EXSvSyoH4NcEh6fbIzPa79LL1Au04c1mUdeSTolsDgs8bWBljXHMSYRc8=')
      })

      it('returns ok', async () => {
        await request(app)
          .post('/base-route/address/name@domain.com')
          .send(get.requestBody)
          .expect(HttpStatus.OK)
      })

      it('with a different valid request it also returns ok', async () => {
        // private key: L3ydNQbUUsNHdyztQLhs2MRvGvSc2XKZYioUmXMPmFRzcF79xJ1r
        get.paymailClient.setValidSignature('H3FjXnM0KuX6y3KOcJwwWFuY+9Zftp4dgQLQII7KPYkwQrdexE9yqRaoxAuFIGep3PFdBuifJEomYkJQQQLOewI=')
        const body = {
          senderName: 'FirstName LastName 2',
          senderHandle: 'principal2@domain.tld',
          dt: moment().toISOString(),
          purpose: 'human readable description 2',
          signature: 'H3FjXnM0KuX6y3KOcJwwWFuY+9Zftp4dgQLQII7KPYkwQrdexE9yqRaoxAuFIGep3PFdBuifJEomYkJQQQLOewI='
        }

        await request(app)
          .post('/base-route/address/name@domain.com')
          .send(body)
          .expect(HttpStatus.OK)
      })

      it('returns the output script', async () => {
        const response = await request(app)
          .post('/base-route/address/name@domain.com')
          .send(get.requestBody)

        expect(response.body).to.be.eql({
          output: get.anOutputScript
        })
      })

      describe('when the handler returns null', () => {
        def('getPaymentDestination', () => () => null)
        it('returns the output script', async () => {
          const response = await request(app)
            .post('/base-route/address/name@domain.com')
            .send(get.requestBody)

          expect(response.status).to.be.equal(HttpStatus.NOT_FOUND)
        })
      })

      describe('callback call', () => {
        def('callsReceived', () => [])
        def('getPaymentDestination', () => (name, domain) => {
          get.callsReceived.push({ name, domain })
        })

        it('calls the callback only once', async () => {
          await request(app)
            .post('/base-route/address/name@domain.com')
            .send(get.requestBody)

          expect(get.callsReceived.length).to.be.eq(1)
        })

        it('gets call with right name and domain', async () => {
          await request(app)
            .post('/base-route/address/name@domain.com')
            .send(get.requestBody)

          const call = get.callsReceived[0]
          expect(call.name).to.be.eq('name')
          expect(call.domain).to.be.eq('domain.com')
        })
      })

      describe('content type header', async () => {
        it('fails when is wrong', async () => {
          const response = await request(app)
            .post('/base-route/address/name@domain.com')
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(JSON.stringify(get.requestBody))

          expect(response.status).to.be.equal(HttpStatus.BAD_REQUEST)
          expect(response.body.code).to.be.equal('wrong-content-type')
        })
      })

      const neededParameters = [
        {
          name: 'senderHandle',
          errorCode: 'missing-sender-handle',
          errorMessage: 'Missing sender handle'
        },
        {
          name: 'dt',
          errorCode: 'missing-dt',
          errorMessage: 'Missing parameter dt'
        }
      ]

      neededParameters.forEach(({ name, errorCode, errorMessage }) => {
        describe(`when ${name} is missing`, async () => {
          it('returns bad request', async () => {
            const { [name]: value, ...filteredBody } = get.requestBody
            await request(app)
              .post('/base-route/address/name@domain.com')
              .send(filteredBody)
              .expect(HttpStatus.BAD_REQUEST)
          })

          it('error description', async () => {
            const { [name]: value, ...filteredBody } = get.requestBody
            const response = await request(app)
              .post('/base-route/address/name@domain.com')
              .send(filteredBody)

            expect(response.body).to.be.eql({
              code: errorCode,
              message: errorMessage
            })
          })
        })
      })

      describe('when the sender paymail is present but is invalid', () => {
        def('requestBody', () => ({
          senderName: 'FirstName LastName',
          senderHandle: 'undefined',
          dt: get.aDatetime,
          amount: 500,
          purpose: 'human readable description',
          signature: 'H35/3nzocVWb2U5dAyIsLWQEEQ3VL2EXSvSyoH4NcEh6fbIzPa79LL1Au04c1mUdeSTolsDgs8bWBljXHMSYRc8='
        }))

        it('returns bad request', async () => {
          await request(app)
            .post('/base-route/address/name@domain.com')
            .send(get.requestBody)
            .expect(HttpStatus.BAD_REQUEST)
        })

        it('error description', async () => {
          const response = await request(app)
            .post('/base-route/address/name@domain.com')
            .send(get.requestBody)

          expect(response.body).to.be.eql({
            code: 'invalid-sender-handle',
            message: 'Invalid sender handle'
          })
        })
      })

      describe('when the sender paymail is present but is has an space', () => {
        def('requestBody', () => ({
          senderName: 'FirstName LastName',
          senderHandle: 'someone@with space',
          dt: get.aDatetime,
          amount: 500,
          purpose: 'human readable description',
          signature: 'H35/3nzocVWb2U5dAyIsLWQEEQ3VL2EXSvSyoH4NcEh6fbIzPa79LL1Au04c1mUdeSTolsDgs8bWBljXHMSYRc8='
        }))

        it('returns bad request', async () => {
          await request(app)
            .post('/base-route/address/name@domain.com')
            .send(get.requestBody)
            .expect(HttpStatus.BAD_REQUEST)
        })

        it('error description', async () => {
          const response = await request(app)
            .post('/base-route/address/name@domain.com')
            .send(get.requestBody)

          expect(response.body).to.be.eql({
            code: 'invalid-sender-handle',
            message: 'Invalid sender handle'
          })
        })
      })

      describe('when senderName is missing', async () => {
        it('returns ok', async () => {
          const { senderName, ...filteredBody } = get.requestBody
          await request(app)
            .post('/base-route/address/name@domain.com')
            .send(filteredBody)
            .expect(HttpStatus.OK)
        })
      })

      describe('when amount is missing', async () => {
        it('returns ok', async () => {
          const { amount, ...filteredBody } = get.requestBody
          await request(app)
            .post('/base-route/address/name@domain.com')
            .send(filteredBody)
            .expect(HttpStatus.OK)
        })
      })

      describe('when requestSenderValidation is set to true', () => {
        def('requestSenderValidation', () => true)

        describe(`when the signature is missing`, async () => {
          it('returns bad request', async () => {
            const { signature, ...filteredBody } = get.requestBody
            await request(app)
              .post('/base-route/address/name@domain.com')
              .send(filteredBody)
              .expect(HttpStatus.BAD_REQUEST)
          })

          it('error description', async () => {
            const { signature, ...filteredBody } = get.requestBody
            const response = await request(app)
              .post('/base-route/address/name@domain.com')
              .send(filteredBody)

            expect(response.body).to.be.eql({
              code: 'missing-signature',
              message: 'Missing signature'
            })
          })
        })

        describe('when the signature is invalid', async () => {
          it('returns status bad request', async () => {
            const body = {
              ...get.requestBody,
              signature: 'wrong signature'
            }

            await request(app)
              .post('/base-route/address/name@domain.com')
              .send(body)
              .expect(HttpStatus.BAD_REQUEST)
          })

          it('returns propper error description', async () => {
            const body = {
              ...get.requestBody,
              signature: 'wrong signature'
            }

            const response = await request(app)
              .post('/base-route/address/name@domain.com')
              .send(body)

            expect(response.body).to.be.eql({
              code: 'bad-signature',
              message: 'Wrong signature'
            })
          })
        })
      })

      describe('when requestSenderValidation is set to false', () => {
        def('requestSenderValidation', () => false)

        describe('if the signature is missing', () => {
          it('returns ok', async () => {
            const { signature, ...filteredBody } = get.requestBody
            await request(app)
              .post('/base-route/address/name@domain.com')
              .send(filteredBody)
              .expect(HttpStatus.OK)
          })

          it('returns a correct output', async () => {
            const { signature, ...filteredBody } = get.requestBody
            const response = await request(app)
              .post('/base-route/address/name@domain.com')
              .send(filteredBody)
              .expect(HttpStatus.OK)

            expect(response.body).to.be.eql({
              output: get.anOutputScript
            })
          })
        })

        describe('if the signature is present and is valid', () => {
          it('returns ok', async () => {
            await request(app)
              .post('/base-route/address/name@domain.com')
              .send(get.requestBody)
              .expect(HttpStatus.OK)
          })

          it('returns a correct output', async () => {
            const response = await request(app)
              .post('/base-route/address/name@domain.com')
              .send(get.requestBody)

            expect(response.body).to.be.eql({
              output: get.anOutputScript
            })
          })
        })

        describe('if the signature is present and is invalid', () => {
          def('requestBody', () => ({
            senderName: 'FirstName LastName',
            senderHandle: 'principal@domain.tld',
            dt: get.aDatetime,
            amount: 500,
            purpose: 'human readable description',
            signature: 'INVALID SIGNATURE'
          }))

          it('returns ok', async () => {
            await request(app)
              .post('/base-route/address/name@domain.com')
              .send(get.requestBody)
              .expect(HttpStatus.OK)
          })

          it('returns a correct output', async () => {
            const response = await request(app)
              .post('/base-route/address/name@domain.com')
              .send(get.requestBody)

            expect(response.body).to.be.eql({
              output: get.anOutputScript
            })
          })
        })
      })
    })
  })
})
