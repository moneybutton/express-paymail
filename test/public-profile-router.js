/* global def, get */
import { buildRouter } from '../src'
import { expect } from 'chai'
import express from 'express'
import request from 'supertest'
import HttpStatus from 'http-status-codes'
import { MockPaymailClient } from './utils/MockPaymailClient'

describe('publicProfileRouter', () => {
  let app = null
  def('paymailClient', () => new MockPaymailClient())
  def('getIdentityKey', () => null)
  def('getPaymentDestination', () => null)
  def('mainUrl', () => 'https://example.org')
  def('publicProfile', () => null)

  def('config', () => ({
    basePath: '/base-route',
    getIdentityKey: get.getIdentityKey,
    getPaymentDestination: get.getPaymentDestination,
    publicProfile: get.publicProfile
  }))

  beforeEach(() => {
    app = express()
    const paymailRouter = buildRouter(get.mainUrl, {
      ...get.config,
      paymailClient: get.paymailClient
    })

    app.use(paymailRouter)
  })

  describe('/base-route/public-profile/:paymail', async () => {
    describe('when the callback is defined', () => {
      def('publicProfile', () => {
        return () => ({
          name: 'someName',
          avatar: 'https://example.com/myavatar.png'
        })
      })

      it('returns http status ok', async () => {
        await request(app)
          .get('/base-route/public-profile/name@domain.com')
          .expect(HttpStatus.OK)
      })

      it('returns the right body', async () => {
        const response = await request(app)
          .get('/base-route/public-profile/name@domain.com')

        expect(response.body).to.be.eql({
          name: 'someName',
          avatar: 'https://example.com/myavatar.png'
        })
      })
    })

    describe('when the callback returns falsey value', () => {
      def('publicProfile', () => {
        return () => null
      })

      it('returns http status not found', async () => {
        await request(app)
          .get('/base-route/public-profile/name@domain.com')
          .expect(HttpStatus.NOT_FOUND)
      })

      it('returns propper error response', async () => {
        const response = await request(app)
          .get('/base-route/public-profile/name@domain.com')

        expect(response.body).to.be.eql({
          code: 'not-found',
          message: 'Paymail not found: name@domain.com.'
        })
      })
    })

    describe('when the callback throws an exception', () => {
      def('publicProfile', () => {
        return () => { throw new Error('boom!') }
      })

      it('returns http status internal server error', async () => {
        await request(app)
          .get('/base-route/public-profile/name@domain.com')
          .expect(HttpStatus.INTERNAL_SERVER_ERROR)
      })
    })

    describe('callback', () => {
      def('callRegistry', () => [])
      def('publicProfile', () => {
        return (local, domain) => {
          get.callRegistry.push({ local, domain })
          return {
            name: 'name',
            avatar: 'avatar'
          }
        }
      })

      it('calls the callback', async () => {
        await request(app)
          .get('/base-route/public-profile/name@domain.com')

        expect(get.callRegistry).to.length(1)
      })

      it('sends the right arguments', async () => {
        await request(app)
          .get('/base-route/public-profile/name@domain.com')

        expect(get.callRegistry).to.be.eql([{
          local: 'name',
          domain: 'domain.com'
        }])
      })
    })

    describe('s query param', () => {
      def('callRegistry', () => [])
      def('publicProfile', () => {
        return (local, domain, size) => {
          get.callRegistry.push({ local, domain, size })
          return {
            name: 'name',
            avatar: 'avatar'
          }
        }
      })

      it('when the value is present is the third attribute of the callback', async () => {
        await request(app)
          .get('/base-route/public-profile/name@domain.com?s=100')

        expect(get.callRegistry).to.be.eql([{
          local: 'name',
          domain: 'domain.com',
          size: 100
        }])
      })

      it('when is not present the third value is null', async () => {
        await request(app)
          .get('/base-route/public-profile/name@domain.com')

        expect(get.callRegistry).to.be.eql([{
          local: 'name',
          domain: 'domain.com',
          size: null
        }])
      })

      it('when is not present but is invalid the third value is null', async () => {
        await request(app)
          .get('/base-route/public-profile/name@domain.com?s=onehundred')

        expect(get.callRegistry).to.be.eql([{
          local: 'name',
          domain: 'domain.com',
          size: null
        }])
      })
    })
  })
})
