/* global describe, it */

const assert = require('assert')
const express = require('express')
const jsonldContextLink = require('..')
const request = require('supertest')
const url = require('url')

describe('jsonld-context-link', () => {
  it('should be a factory', () => {
    assert.equal(typeof jsonldContextLink, 'function')
    assert.equal(jsonldContextLink.length, 1)
  })

  it('should set basePath to "/"', () => {
    const middleware = jsonldContextLink()

    assert.equal(middleware.basePath, '/')
  })

  it('should set basePath to the value given in options', () => {
    const middleware = jsonldContextLink({basePath: '/example/'})

    assert.equal(middleware.basePath, '/example/')
  })

  it('should assign an empty object to contexts', () => {
    const middleware = jsonldContextLink()

    assert.deepEqual(middleware.contexts, {})
  })

  it('should assign an empty object to keys', () => {
    const middleware = jsonldContextLink()

    assert.deepEqual(middleware.keys, {})
  })

  describe('setContext', () => {
    it('should be a function', () => {
      const middleware = jsonldContextLink()

      assert.equal(typeof middleware.setContext, 'function')
      assert.equal(middleware.setContext.length, 2)
    })

    it('should add a context combining basePath and key', () => {
      const middleware = jsonldContextLink({basePath: '/example/'})

      middleware.setContext({'@vocab': 'http://schema.org/'}, 'schema')

      assert.deepEqual(middleware.contexts, {
        '/example/schema': {
          '@vocab': 'http://schema.org/'
        }
      })
    })

    it('should add the key to the key map', () => {
      const middleware = jsonldContextLink({basePath: '/example/'})

      middleware.setContext({'@vocab': 'http://schema.org/'}, 'schema')

      assert.deepEqual(middleware.keys, {
        schema: '/example/schema'
      })
    })

    it('should return the generated path', () => {
      const middleware = jsonldContextLink({basePath: '/example/'})

      const path = middleware.setContext({'@vocab': 'http://schema.org/'}, 'schema')

      assert.equal(path, '/example/schema')
    })

    it('should reuse the same context with a different key', () => {
      const middleware = jsonldContextLink({basePath: '/example/'})

      middleware.setContext({'@vocab': 'http://schema.org/'}, 'schema')
      middleware.setContext({'@vocab': 'http://example.org/'}, 'other')
      middleware.setContext({'@vocab': 'http://schema.org/'}, 'schema1')

      assert.deepEqual(middleware.keys, {
        other: '/example/other',
        schema: '/example/schema',
        schema1: '/example/schema'
      })
    })
  })

  describe('middleware', () => {
    it('should be a function with 3 arguments', () => {
      const middleware = jsonldContextLink()

      assert.equal(typeof middleware, 'function')
      assert.equal(middleware.length, 3)
    })

    it('should attach the .setJsonldContext method', () => {
      const middleware = jsonldContextLink()
      const app = express()

      app.use(middleware)

      app.use((req, res, next) => {
        Promise.resolve().then(() => {
          assert.equal(typeof res.setJsonldContext, 'function')
        }).then(next).catch(next)
      })

      return request(app).get('/').expect(404)
    })

    it('should send the context link header to the given key', () => {
      const middleware = jsonldContextLink()
      const app = express()

      app.use(middleware)

      middleware.setContext({'@vocab': 'http://schema.org/'}, 'schema')

      app.use((req, res) => {
        res.setJsonldContext('schema')

        res.end()
      })

      return request(app).get('/').then((res) => {
        const host = res.req._headers.host

        assert.equal(res.headers.link, '<http://' + host + '/schema>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"')
      })
    })

    it('should send the context link header to the given context and key', () => {
      const middleware = jsonldContextLink()
      const app = express()

      app.use(middleware)

      app.use((req, res) => {
        res.setJsonldContext({'@vocab': 'http://schema.org/'}, 'schema')

        res.end()
      })

      return request(app).get('/').then((res) => {
        const host = res.req._headers.host

        assert.equal(res.headers.link, '<http://' + host + '/schema>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"')
      })
    })

    it('should attach the context the res.locals.jsonldContext', () => {
      const middleware = jsonldContextLink()
      const app = express()

      app.use(middleware)

      app.use((req, res, next) => {
        const context = {'@vocab': 'http://schema.org/'}

        res.setJsonldContext(context, 'schema')

        Promise.resolve().then(() => {
          assert.deepEqual(res.locals.jsonldContext, context)
        }).then(next).catch(next)
      })

      return request(app).get('/').expect(404)
    })

    it('should host the context', () => {
      const middleware = jsonldContextLink()
      const app = express()

      app.use(middleware)

      app.use((req, res) => {
        res.setJsonldContext({'@vocab': 'http://schema.org/'}, 'schema')

        res.end()
      })

      return request(app).get('/').then((res) => {
        const contextLink = url.parse(res.headers.link.split(';').shift().slice(1, -1)).pathname

        return request(app).get(contextLink).then((res) => {
          assert.equal(res.headers['content-type'].split(';').shift(), 'application/ld+json')
          assert.equal(res.text, '{"@vocab":"http://schema.org/"}')
        })
      })
    })
  })
})
