import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> 
{
    await knex.schema.alterTable('translation_sessions', table =>
    {
        table.json("chat_history").notNullable().defaultTo('[]');
    });
}


export async function down(knex: Knex): Promise<void> 
{
    await knex.schema.alterTable('translation_sessions', table =>
    {
        table.dropColumn("chat_history");
    });
}

