const absoluteUrl = require('absolute-url')
const isEqual = require('lodash/isEqual')
const path = require('path')
const setLink = require('set-link')
const url = require('url')

function handle (req, res, next) {
  res.setJsonldContext = setContextLink.bind(this, req, res)

  const pathname = url.parse(req.url).pathname

  if (pathname in this.contexts) {
    res.set('content-type', 'application/ld+json')
    res.json(this.contexts[pathname])
  } else {
    next()
  }
}

function setContext (context, key) {
  let pathname = Object.keys(this.contexts).reduce((match, pathname) => {
    return match || (isEqual(this.contexts[pathname], context) ? pathname : null)
  }, null)

  if (!pathname) {
    pathname = path.resolve(this.basePath, key)

    this.contexts[pathname] = context
  }

  this.keys[key] = pathname

  return pathname
}

function setContextLink (req, res, context, key) {
  let pathname

  if (key) {
    pathname = this.setContext(context, key)
  } else {
    pathname = this.keys[context]
  }

  absoluteUrl.attach(req)
  setLink.attach(res)

  res.setLink(absoluteLink(req, pathname), 'http://www.w3.org/ns/json-ld#context', {
    type: 'application/ld+json'
  })

  res.locals.jsonldContext = context
}

function absoluteLink (req, pathname) {
  const base = url.parse(req.absoluteUrl())

  base.pathname = pathname
  base.search = null
  base.query = null

  return url.format(base)
}

function factory (options) {
  options = options || {}

  const middleware = (req, res, next) => {
    handle.call(middleware, req, res, next)
  }

  middleware.basePath = options.basePath || '/'
  middleware.contexts = {}
  middleware.keys = {}
  middleware.setContext = setContext.bind(middleware)

  return middleware
}

module.exports = factory
