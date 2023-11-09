# fastify-at-postgres

![Continuous Integration](https://github.com/mateonunez/fastify-at-postgres/workflows/ci/badge.svg)

Fastify Postgres alternative plugin.

## Installation

```
npm install fastify-at-postgres
```

## Getting Started

The `fastify-at-postgres` plugin is a wrapper around the `@databases/pg` package. It exposes the `postgres` property on the Fastify instance.

```js
const Fastify = require('fastify')
const fastifyAtPostgres = require('fastify-at-postgres')

const fastify = fastify()
fastify.register(fastifyAtPostgres, {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
})

fastify.get('/', async (request, reply) => {
  const result = await fastify.pg.query('SELECT * FROM contributors')  
  reply.send(result)
})
```

### Instance

```js
const db = {
  query,        // use this to create queries in a simple way
  transaction,  // use this to create transactions
  task,         // use this to create tasks
  sql,          // method to create queries in a safe-way
  db,           // database object
}
```

#### Query

The `query` property automatically wraps the `sql` method. It gives you a powerful and flexible way of creating queries without opening yourself to SQL Injection attacks. [Read more here](https://www.atdatabases.org/docs/sql)

```js
const result = await fastify.pg.query(sql`SELECT * FROM contributors`)
```

You can also specify the type of the result between: `raw`, `iterator`, `stream`:

**Raw**
```js
const result = await fastify.pg.query(sql`SELECT * FROM contributors`, { type: 'raw' }) // default
console.log(result) // [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
```

**Iterator**
```js
for await (const row of fastify.pg.query(sql`SELECT * FROM contributors`, { type: 'iterator' })) {
  console.log(row) // { id: 1, name: 'John' }
}
```

**Stream**
```js
const { Transform } = require('node:stream')
const stringify = new Transform({
  writableObjectMode: true,
  transform (chunk, _, callback) {
    this.push(JSON.stringify(chunk) + '\n')
    callback()
  }
})

const stream = fastify.pg.query(sql`SELECT * FROM contributors`, { type: 'stream' })
stream.pipe(stringify).pipe(process.stdout) // { id: 1, name: 'John' }
```


#### Transaction

The `transaction` function is used to execute multiple queries in a single transaction. [Read more here](https://www.atdatabases.org/docs/transactions)

```js
const txs = [
  (db) => db.query(fastify.pg.sql`INSERT INTO contributors (name) VALUES ('John')`),
  (db) => db.query(fastify.pg.sql`INSERT INTO contributors (name) VALUES ('Jane')`),
]

const result = await fastify.pg.transaction(txs)
```

#### Task

The `task` function is used to execute a single set of operations as a single task. [Read more here](https://www.atdatabases.org/docs/tasks)

```js
const task = (db) => {
  return db.query(fastify.pg.sql`INSERT INTO contributors (name) VALUES ('John')`)
}

const result = await fastify.pg.task(task)
```

## Options

The plugin accepts the following options:

- `host` - The hostname of the database you are connecting to. (Default: `localhost`)
- `port` - The port number to connect to. (Default: `3306`)
- `user` - The Postgres user to authenticate as.
- `password` - The password of that Postgres user.
- `database` - Name of the database to use for this connection (Optional).
- `connectionString` - A connection string to use instead of the connection options. (Optional)
- `name` - Name of the database instance if you want to use multiple databases. (Optional)

## License

**fastify-at-postgres** is licensed under the [MIT](LICENSE) license.
