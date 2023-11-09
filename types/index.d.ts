import { Connection, ConnectionPool, ConnectionPoolConfig, Transaction } from "@databases/pg";
import { SQL } from "@databases/sql";
import { FastifyPluginCallback } from "fastify";

interface FastifyAtPostgresPluginOptions extends ConnectionPoolConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  name?: string;
}

declare const fastifyAtPostgres: FastifyPluginCallback<FastifyAtPostgresPluginOptions>;

type QueryType = "raw" | "iterable" | "stream";

type QueryOptions = {
  type?: QueryType;
};

type PostgresInstance = {
  query<T>(query: string, options?: QueryOptions): QueryOptions["type"] extends "iterable"
    ? AsyncIterable<T>
    : QueryOptions["type"] extends "stream"
    ? NodeJS.ReadableStream
    : Promise<T[]>;
  transaction<T>(fn: (connection: Transaction) => Promise<T>): Promise<T>;
  task<T>(fn: (connection: Connection | Transaction) => Promise<T>): Promise<T>;
  sql: SQL;
  db: ConnectionPool;
};

declare module "fastify" {
  interface FastifyInstance {
    pg: PostgresInstance & {
      [instanceName: string]: PostgresInstance;
    };
  }
}

export { fastifyAtPostgres as default };
export { fastifyAtPostgres };
