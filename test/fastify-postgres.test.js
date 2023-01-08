'use strict'

const t = require('tap')
const test = t.test
const Fastify = require('fastify')
const fastifyPostgres = require('..')

const options = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'test'
}

test('fastify-at-postgres is correctly defined', ({ ok, plan }) => {
  plan(1)

  const fastify = Fastify()
  fastify.register(fastifyPostgres, options)

  fastify.ready(() => {
    ok(fastify.pg)
    fastify.close()
  })
})

test('fastify-at-postgres can connect to a Postgres database', ({ error, ok, plan }) => {
  plan(2)

  const fastify = Fastify()
  fastify.register(fastifyPostgres, options)

  fastify.ready(async (err) => {
    error(err)

    const result = await fastify.pg.query('SELECT NOW()')
    ok(result.length)

    fastify.close()
  })
})

test('fastify-at-postgres can connect to a Postgres database with a connection string', ({ error, ok, plan }) => {
  plan(2)

  const fastify = Fastify()
  fastify.register(fastifyPostgres, { connectionString: 'postgres://postgres:postgres@localhost:5432/test' })

  fastify.ready(async (err) => {
    error(err)

    const result = await fastify.pg.query('SELECT NOW()')
    ok(result.length)

    fastify.close()
  })
})

test('should works with multiple instances', ({ error, ok, plan }) => {
  plan(3)
  const fastify = Fastify()

  fastify.register(fastifyPostgres, { ...options, name: 'first_db' })
  fastify.register(fastifyPostgres, { ...options, name: 'second_db' })

  fastify.ready(async (err) => {
    error(err)

    const resultFirst = await fastify.pg.first_db.query('SELECT NOW()')
    ok(resultFirst.length)

    const resultSecond = await fastify.pg.second_db.query('SELECT NOW()')
    ok(resultSecond.length)

    fastify.close()
  })
})

test('should throw with missing options', ({ ok, same, plan }) => {
  plan(2)
  const fastify = Fastify()

  fastify.register(fastifyPostgres)

  fastify.ready((errors) => {
    ok(errors)
    same(errors.message, 'Missing required options')
    fastify.close()
  })
})

test('should throw with invalid connection string', ({ ok, same, plan }) => {
  plan(2)
  const fastify = Fastify()

  fastify.register(fastifyPostgres, { connectionString: 'postgres://postgres:postgres@localhost:5432' })

  fastify.ready((errors) => {
    ok(errors)
    same(errors.message, 'Invalid connection string')
    fastify.close()
  })
})

test('should throw with multiple instances and same name', ({ ok, same, plan }) => {
  plan(2)
  const fastify = Fastify()

  fastify.register(fastifyPostgres, { ...options, name: 'first_db' })
  fastify.register(fastifyPostgres, { ...options, name: 'first_db' })

  fastify.ready((errors) => {
    ok(errors)
    same(errors.message, "fastify-postgres has already been registered with name 'first_db'")
    fastify.close()
  })
})

test('should throw without name option and multiple instances', ({ ok, same, plan }) => {
  plan(2)
  const fastify = Fastify()

  fastify.register(fastifyPostgres, { ...options })
  fastify.register(fastifyPostgres, { ...options })

  fastify.ready((errors) => {
    ok(errors)
    same(errors.message, 'fastify-postgres or another pg plugin has already been registered')
    fastify.close()
  })
})

test('should create a single query and execute it with the transaction() method', ({ error, ok, plan }) => {
  plan(2)

  const fastify = Fastify()
  fastify.register(fastifyPostgres, { ...options, name: 'first_db' })

  fastify.ready(async (err) => {
    error(err)

    const queryArray = ['SELECT NOW()']

    const result = await fastify.pg.first_db.transaction(queryArray)
    ok(result.length)

    fastify.close()
  })
})

test('should create an array of queries and execute it with the transaction() method', ({ error, ok, plan, same }) => {
  plan(4)

  const fastify = Fastify()
  fastify.register(fastifyPostgres, { ...options, name: 'first_db' })

  fastify.ready(async (err) => {
    error(err)

    const queryArray = ['SELECT 1+1 as result;', 'SELECT 4+4 as result;']

    const result = await fastify.pg.first_db.transaction(queryArray)

    ok(result.length)

    same(result[0], 2)
    same(result[1], 8)

    fastify.close()
  })
})
