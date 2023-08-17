import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> 
{
    await knex.schema.alterTable('helpdesk_calls', table =>
    {
        table.dropColumn('created_at');
        table.datetime('created_at_dt').notNullable();
    });

    await knex.schema.alterTable('helpdesk_messages', table =>
    {
        table.dropColumn('created_at');
        table.datetime('sent_at').notNullable();
    });
}


export async function down(knex: Knex): Promise<void> 
{
    await knex.schema.alterTable('helpdesk_calls', table =>
    {
        table.dropColumn('created_at_dt');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });

    await knex.schema.alterTable('helpdesk_messages', table =>
    {
        table.dropColumn('sent_at');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
}

