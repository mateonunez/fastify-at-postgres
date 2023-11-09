'use strict'

const t = require('tap')
const test = t.test
const { buildConnectionString, validateConnectionString } = require('../lib/connection-string')

test('buildConnectionString should return a valid connection string', ({ same, plan }) => {
  plan(1)

  const connectionString = buildConnectionString({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'test'
  })

  same(connectionString, 'postgres://postgres:postgres@localhost:5432/test')
})

test('validateConnectionString should return true for a valid connection string', ({ ok, plan }) => {
  plan(1)

  const connectionString = buildConnectionString({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'test'
  })

  ok(validateConnectionString(connectionString))
})

test('validateConnectionString should return true for a valid connection string using ip address', ({ ok, plan }) => {
  plan(1)

  ok(validateConnectionString('postgres://postgres:postgres@127.0.0.1:5432/test'))
})

test('validateConnectionString should return false for an invalid connection string', ({ notOk, plan }) => {
  plan(1)

  const connectionString = 'postgres://not_valid@localhost:5432'

  notOk(validateConnectionString(connectionString))
})
