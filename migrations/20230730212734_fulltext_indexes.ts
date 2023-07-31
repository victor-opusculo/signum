import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> 
{
    await knex.schema.alterTable('interpreters', table =>
    {
        table.index(['name', 'description', 'username'], undefined, 'fulltext');
    });

    await knex.schema.alterTable('organizations', table =>
    {
        table.index(['name', 'email', 'username'], undefined, 'fulltext');
    });

    await knex.schema.alterTable('customers', table =>
    {
        table.index(['name', 'username'], undefined, 'fulltext');
    });

    await knex.schema.alterTable('helpdesk_calls', table =>
    {
        table.index(['title'], undefined, 'fulltext');
    });

    await knex.schema.alterTable('helpdesk_messages', table =>
    {
        table.index(['message', 'sender_name'], undefined, 'fulltext');
    });
}


export async function down(knex: Knex): Promise<void> 
{
    await knex.schema.alterTable('interpreters', table =>
    {
        table.dropIndex(['name', 'description', 'username']);
    });

    await knex.schema.alterTable('organizations', table =>
    {
        table.dropIndex(['name', 'email', 'username']);
    });

    await knex.schema.alterTable('customers', table =>
    {
        table.dropIndex(['name', 'username']);
    });

    await knex.schema.alterTable('helpdesk_calls', table =>
    {
        table.dropIndex(['title']);
    });

    await knex.schema.alterTable('helpdesk_messages', table =>
    {
        table.dropIndex(['message', 'sender_name']);
    });
}

