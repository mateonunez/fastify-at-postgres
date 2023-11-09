'use strict'

function buildConnectionString ({ host, user, password, database, port }) {
  return `postgres://${user}:${password}@${host}:${port}/${database}`
}

function validateConnectionString (connectionString) {
  const regex = /^postgres:\/\/([a-zA-Z0-9._%-]+):([a-zA-Z0-9._%-]+)@([a-zA-Z0-9.-]+):([0-9]+)\/([a-zA-Z0-9_]+)$/
  return regex.test(connectionString)
}

module.exports = {
  buildConnectionString,
  validateConnectionString
}
