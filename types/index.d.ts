import { ConnectionPoolConfig } from "@databases/pg";
import { FastifyPluginCallback } from "fastify";

type fastifyPostgres = FastifyPluginCallback<fastifyPostgres.PostgresOptions>

declare namespace fastifyPostgres {
  export interface PostgresOptions extends ConnectionPoolConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }

  export const fastifyPostgres: fastifyPostgres
  export { fastifyPostgres as default }
}

declare function fastifyPostgres(...params: Parameters<fastifyPostgres>): ReturnType<fastifyPostgres>
export = fastifyPostgres
