import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> 
{
    await knex.schema.alterTable('interpreters', table =>
    {
        table.integer('signorum_main_intr_id').unsigned().nullable().alter();
    });
}


export async function down(knex: Knex): Promise<void> 
{
    await knex.schema.alterTable('interpreters', table =>
    {
        table.integer('signorum_main_intr_id').unsigned().notNullable().alter();
    });
}

