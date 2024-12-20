import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> 
{
    await knex.schema.alterTable('translation_sessions', table =>
    {
        table.string("room_uuid", 120).nullable();
    });
}


export async function down(knex: Knex): Promise<void> 
{
    await knex.schema.alterTable('translation_sessions', table =>
    {
        table.dropColumn('room_uuid');
    });
}

