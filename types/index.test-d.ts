import fastify from 'fastify'
import fastifyAtPostgres from '..'
import { expectType } from 'tsd'

const app = fastify()

app
  .register(fastifyAtPostgres, {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'test',
  })
  .after((err) => {
    app.pg.query('SELECT * FROM users')
    expectType<Promise<any[]>>(app.pg.query('SELECT * FROM users'))
    expectType<Promise<any[]>>(app.pg.transaction((conn) => conn.query(app.pg.sql`SELECT * FROM users`)))
    expectType<Promise<any[]>>(app.pg.task((conn) => conn.query(app.pg.sql`SELECT * FROM users`)))
    expectType<Promise<void>>(app.pg.db.dispose())
    app.pg.db.dispose()
  })
