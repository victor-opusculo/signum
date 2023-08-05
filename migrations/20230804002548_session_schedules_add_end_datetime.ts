import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> 
{
    await knex.schema.alterTable('session_schedules', table => 
    {
        table.datetime('expected_end_datetime').notNullable().after('scheduled_datetime');
        table.string('room_id', 140).nullable().after('customer_id');
        table.string('description', 140).nullable();
    });
}

export async function down(knex: Knex): Promise<void> 
{
    await knex.schema.alterTable('session_schedules', table => 
    {
        table.dropColumn('expected_end_datetime');
        table.dropColumn('room_id');
        table.dropColumn('description');
    });
}