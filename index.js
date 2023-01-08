'use strict'

const fp = require('fastify-plugin')
const createConnectionPool = require('@databases/pg')
const { buildConnectionString, validateConnectionString } = require('./lib/connection-string')

function fastifyPostgres (fastify, options, next) {
  const { host, user, password, database, port = 5432, connectionString = null, name = null } = options
  if (connectionString) {
    if (!validateConnectionString(connectionString)) {
      return next(new Error('Invalid connection string'))
    }
  } else if (!host || !user || !password || !database) {
    return next(new Error('Missing required options'))
  }

  const { sql } = createConnectionPool
  const db = createConnectionPool({
    connectionString: connectionString || buildConnectionString({ host, user, password, database, port })
  })

  fastify.addHook('onClose', (_, done) => {
    db.dispose().then(() => done()).catch(done)
  })

  async function executeTransaction (queries) {
    const transactionResult = await db.tx(async () => {
      const results = []
      for (const query of queries) {
        const result = await db.query(sql(query))
        results.push(result[0].result)
      }
      return results
    })

    return transactionResult
  }

  const decoratorObject = {
    query: (queryString) => db.query(sql(queryString)),
    transaction: async (queryArray) => await executeTransaction(queryArray),
    sql,
    db
  }

  if (name) {
    if (!fastify.pg) {
      fastify.decorate('pg', {})
    }

    if (fastify.pg[name]) {
      return next(new Error(`fastify-postgres has already been registered with name '${name}'`))
    }

    fastify.pg[name] = decoratorObject
  } else {
    if (fastify.pg || fastify.postgres) {
      return next(new Error('fastify-postgres or another pg plugin has already been registered'))
    }

    fastify.decorate('pg', decoratorObject)
  }

  next()
}

module.exports = fp(fastifyPostgres, {
  fastify: '4.x',
  name: 'fastify-postgres'
})

module.exports.default = fastifyPostgres
module.exports.fastifyPostgres = fastifyPostgres
