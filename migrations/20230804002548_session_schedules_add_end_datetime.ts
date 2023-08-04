import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> 
{
    await knex.schema.alterTable('session_schedules', table => 
        table.datetime('expected_end_datetime').notNullable().after('scheduled_datetime'));
}

export async function down(knex: Knex): Promise<void> 
{
    await knex.schema.alterTable('session_schedules', table => 
        table.dropColumn('expected_end_datetime'));
}