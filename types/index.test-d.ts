import fastify from 'fastify'
import fastifyPostgres from '..'

declare module 'fastify' {
  interface FastifyInstance {
    pg: any
  }
}

const app = fastify()

app
  .register(fastifyPostgres, {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'test',
  })
  .after((err) => {
    app.pg.query('SELECT NOW()')
    app.pg.close()
  })
