# jsonld-context-link

[![Build Status](https://travis-ci.org/bergos/jsonld-context-link.svg?branch=master)](https://travis-ci.org/bergos/jsonld-context-link)
[![npm version](https://badge.fury.io/js/jsonld-context-link.svg)](https://badge.fury.io/js/jsonld-context-link)

Express middleware for easy JSON-LD link header handling.
The middleware sends the link header for JSON-LD contexts and hosts the contexts. 

## Usage

The middleware accepts an optional `basePath` parameter.
`basePath` is used to prefix the context links.
The default value for `basePath` is `/`.
To avoid conflicts it's better define a path which isn't used anywhere else in the application.
This would create the middleware, set the `basePath` to `/context/` and attach it to the app:

```
const jsonldContextLink = require('jsonld-context-link')

const app = express()

const contexts = jsonldContextLink({basePath: '/context/'})

app.use(setLink)
```

With `.setContext` a new context is registered with the given key:

```
contexts.setContext({'@vocab': 'http://schema.org/'}, 'schema')
```

Now it can be used:

```
app.use((req, res) => {
  res.setJsonldContext('schema')

  ...
})
```
