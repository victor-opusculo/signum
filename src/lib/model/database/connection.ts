declare global 
{
    var db: Knex|undefined;
}

import knex, { Knex } from "knex";


const registerDatabase = (initFn: () => Knex) => 
{
    if (process.env.NODE_ENV === 'development') 
    {
        if (!global.db)
            global.db = initFn();

        return global.db;
    }
    return initFn();
  };

export let current: Knex;

export function create(): Knex
{
    let _conn = knex
    ({
        client: 'mysql',
        connection:
        {
            host: process.env.SIGNUM_DATABASE_HOST,
            port: 3306,
            user: process.env.SIGNUM_DATABASE_USER,
            password: process.env.SIGNUM_DATABASE_PASS,
            database: process.env.SIGNUM_DATABASE_NAME,
            timezone: 'UTC'
        },
        pool: { min: 0, max: 10 }
    });
    console.log("New connection");
    return _conn;
}

export default function get(): Knex
{
    if (!current)
        current = registerDatabase(create);

    return current;
}