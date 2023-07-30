import type { Knex } from "knex";
import dotenv from 'dotenv-flow';

dotenv.config();

// Update with your config settings.

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "mysql",
    connection: 
    {
      host: process.env.SIGNUM_DATABASE_HOST,
      user: process.env.SIGNUM_DATABASE_USER,
      password: process.env.SIGNUM_DATABASE_PASS,
      database: process.env.SIGNUM_DATABASE_NAME
    },
    pool: 
    {
      min: 2,
      max: 10
    },
    migrations: 
    {
      tableName: "knex_migrations"
    }
  },

  staging: {
    client: "mysql",
    connection: 
    {
      host: process.env.SIGNUM_T_DATABASE_HOST,
      user: process.env.SIGNUM_T_DATABASE_USER,
      password: process.env.SIGNUM_T_DATABASE_PASS,
      database: process.env.SIGNUM_T_DATABASE_NAME
    },
    pool: 
    {
      min: 2,
      max: 10
    },
    migrations: 
    {
      tableName: "knex_migrations"
    }
  },

  production: {
    client: "mysql",
    connection: 
    {
      host: process.env.SIGNUM_P_DATABASE_HOST,
      user: process.env.SIGNUM_P_DATABASE_USER,
      password: process.env.SIGNUM_P_DATABASE_PASS,
      database: process.env.SIGNUM_P_DATABASE_NAME
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  }

};

module.exports = config;
