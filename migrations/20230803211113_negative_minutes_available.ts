import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> 
{
    await knex.schema.alterTable('customers', table =>
    {
        table.integer('minutes_available').notNullable().alter({ alterType: true});
    });
}


export async function down(knex: Knex): Promise<void> 
{
    await knex.schema.alterTable('customers', table =>
    {
        table.integer('minutes_available').notNullable().unsigned().alter({ alterType: true});
    });
}

