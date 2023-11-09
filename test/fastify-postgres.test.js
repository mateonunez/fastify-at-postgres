'use strict'

const { Transform } = require('node:stream')
const { test } = require('tap')
const Fastify = require('fastify')
const fastifyAtPostgres = require('..')

const options = {
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'test'
}

test('fastify-postgres is correctly defined', async ({ ok }) => {
  const fastify = Fastify()
  await fastify.register(fastifyAtPostgres, options)

  await fastify.ready()
  ok(fastify.pg)
  await fastify.close()
})

test('fastify-postgres can connect to a Postgres database', async ({ error, ok, teardown }) => {
  teardown(() => fastify.close())

  const fastify = Fastify()
  await fastify.register(fastifyAtPostgres, options)

  try {
    const result = await fastify.pg.query('SELECT NOW()')
    ok(result.length)
  } catch (err) {
    error(err)
  }
})

test('fastify-postgres can connect to a Postgres database using a connection string', async ({ error, ok, teardown }) => {
  teardown(() => fastify.close())

  const fastify = Fastify()
  await fastify.register(fastifyAtPostgres, {
    connectionString: 'postgres://postgres:postgres@127.0.0.1:5432/test'
  })

  try {
    const result = await fastify.pg.query('SELECT NOW()')
    ok(result.length)
  } catch (err) {
    error(err)
  }
})

test('should works with multiple instances', async ({ error, ok, teardown }) => {
  teardown(() => fastify.close())

  const fastify = Fastify()
  await fastify.register(fastifyAtPostgres, { ...options, name: 'first_db' })
  await fastify.register(fastifyAtPostgres, { ...options, name: 'second_db' })

  try {
    const result = await fastify.pg.first_db.query('SELECT NOW()')
    ok(result.length)
    const result2 = await fastify.pg.second_db.query('SELECT NOW()')
    ok(result2.length)
  } catch (err) {
    error(err)
  }
})

test('should throw with missing options', async ({ same, teardown }) => {
  teardown(() => fastify.close())

  const fastify = Fastify()
  try {
    await fastify.register(fastifyAtPostgres, {})
  } catch (err) {
    same(err.message, 'Missing required options')
  }
})

test('should throw with invalid connection string', async ({ same, teardown }) => {
  teardown(() => fastify.close())

  const fastify = Fastify()
  try {
    await fastify.register(fastifyAtPostgres, { connectionString: 'invalid' })
  } catch (err) {
    same(err.message, 'Invalid connection string')
  }
})

test('should throw with multiple instances with same name', async ({ same, teardown }) => {
  teardown(() => fastify.close())

  const fastify = Fastify()
  try {
    await fastify.register(fastifyAtPostgres, { ...options, name: 'first_db' })
    await fastify.register(fastifyAtPostgres, { ...options, name: 'first_db' })
  } catch (err) {
    same(err.message, "fastify-postgres has already been registered with name 'first_db'")
  }
})

test('should throw without name option and multiple instances', async ({ same, teardown }) => {
  teardown(() => fastify.close())

  const fastify = Fastify()
  try {
    await fastify.register(fastifyAtPostgres, options)
    await fastify.register(fastifyAtPostgres, options)
  } catch (err) {
    same(err.message, 'fastify-postgres or another pg plugin has already been registered')
  }
})

test('should create a single query and execute it with the transaction() method', async ({ error, teardown, same }) => {
  teardown(() => fastify.close())

  const fastify = Fastify()

  const instanceName = 'first_db'
  await fastify.register(fastifyAtPostgres, { ...options, name: instanceName })

  const tx = () => {
    const result = fastify.pg[instanceName].transaction((db) => {
      return db.query(fastify.pg[instanceName].sql`SELECT 1+1 as result;`)
    })
    return result
  }

  try {
    const result = await fastify.pg[instanceName].transaction(tx)
    same(result, [{ result: 2 }])
  } catch (err) {
    error(err)
  }
})

test('should create an array of queries and execute it with the transaction() method', async ({ error, teardown, same }) => {
  teardown(() => fastify.close())

  const fastify = Fastify()

  const instanceName = 'first_db'
  await fastify.register(fastifyAtPostgres, { ...options, name: instanceName })

  const txs = [
    () => {
      return fastify.pg[instanceName].query('SELECT 1+1 as result;')
    },
    () => {
      return fastify.pg[instanceName].query('SELECT 4+4 as result;')
    }
  ]

  try {
    const result = await fastify.pg[instanceName].transaction(txs)
    same(result, [[{ result: 2 }], [{ result: 8 }]])
  } catch (err) {
    error(err)
  }
})

test('should throw if the transaction is not a function', async ({ same, teardown }) => {
  teardown(() => fastify.close())

  const fastify = Fastify()

  const instanceName = 'first_db'
  await fastify.register(fastifyAtPostgres, { ...options, name: instanceName })

  try {
    await fastify.pg[instanceName].transaction('not a function')
  } catch (err) {
    same(err.message, 'Transaction must be a function')
  }
})

test('should throw if the array of transactions contains a non-function', async ({ same, teardown }) => {
  teardown(() => fastify.close())

  const fastify = Fastify()

  const instanceName = 'first_db'
  await fastify.register(fastifyAtPostgres, { ...options, name: instanceName })

  const txs = [
    () => {
      return fastify.pg[instanceName].query('SELECT 1+1 as result;')
    },
    'not a function'
  ]

  try {
    await fastify.pg[instanceName].transaction(txs)
  } catch (err) {
    same(err.message, 'Transaction must be a function')
  }
})

test('should execute a task', async ({ error, same, teardown }) => {
  teardown(() => fastify.close())

  const fastify = Fastify()

  const instanceName = 'first_db'
  await fastify.register(fastifyAtPostgres, { ...options, name: instanceName })

  const task = (db) => {
    return db.query(fastify.pg[instanceName].sql`SELECT 1+1 as result;`)
  }

  try {
    const result = await fastify.pg[instanceName].task(task)
    same(result, [{ result: 2 }])
  } catch (err) {
    error(err)
  }
})

test('should select on node iterable', async ({ same, teardown }) => {
  teardown(() => fastify.close())
  const fastify = Fastify()
  const instanceName = 'first_db'
  await fastify.register(fastifyAtPostgres, { ...options, name: instanceName })

  for await (const row of fastify.pg[instanceName].query('SELECT 1+1 as result;', { type: 'iterable' })) {
    same(row, { result: 2 })
  }
})

test('should select on node stream', async ({ same, teardown }) => {
  const stringify = new Transform({
    writableObjectMode: true,
    transform (chunk, _, callback) {
      this.push(JSON.stringify(chunk) + '\n')
      callback()
    }
  })

  teardown(() => fastify.close())
  const fastify = Fastify()
  const instanceName = 'first_db'
  await fastify.register(fastifyAtPostgres, { ...options, name: instanceName })

  const stream = fastify.pg[instanceName].query('SELECT 1+1 as result;', { type: 'stream' })
  stream.pipe(stringify).pipe(process.stdout)

  for await (const row of stream) {
    same(row, { result: 2 })
  }
})

test('should throw with invalid type', async ({ same, teardown }) => {
  teardown(() => fastify.close())
  const fastify = Fastify()
  const instanceName = 'first_db'
  await fastify.register(fastifyAtPostgres, { ...options, name: instanceName })

  try {
    await fastify.pg[instanceName].query('SELECT 1+1 as result;', { type: 'invalid' })
  } catch (err) {
    same(err.message, 'Invalid result type: invalid')
  }
})

test('fastify-at-postgres allow to pass atdatabase options', ({ error, ok, plan }) => {
  plan(4)

  const fastify = Fastify()

  fastify.register(fastifyPostgres, {
    connectionString: 'postgres://postgres:postgres@localhost:5432/test',
    bigIntMode: 'string'
  })

  fastify.ready(async (err) => {
    error(err)

    const result = await fastify.pg.query('SELECT NOW()')
    ok(result.length)

    const numberResult = await fastify.pg.query('SELECT 1+1 as result')
    ok(typeof numberResult[0].result === 'number')

    const bigIntResult = await fastify.pg.query(`SELECT ${Number.MAX_SAFE_INTEGER} as result`)
    ok(typeof bigIntResult[0].result === 'string')

    fastify.close()
  })
})
