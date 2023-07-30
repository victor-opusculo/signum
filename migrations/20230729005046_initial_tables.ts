import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> 
{
    await knex.schema.createTable('interpreters', table =>
    {
        table.increments('id', { primaryKey: true }).unsigned();
        table.string('name', 400).notNullable();
        table.text('description').nullable();
        table.string('photo_filename', 255).nullable();
        table.integer('signorum_main_intr_id').unsigned().notNullable();
        table.string('username', 140).notNullable().unique();
        table.string('password_hash', 400).notNullable();
    });

    await knex.schema.createTable('organizations', table =>
    {
        table.increments('id', { primaryKey: true }).unsigned();
        table.string('name', 400).notNullable();
        table.string('email', 280).nullable();
        table.json('other_infos_json').nullable();
        table.string('username', 140).notNullable().unique();
        table.string('password_hash', 400).notNullable();
        table.string('logo_filename', 255).nullable();
    });

    await knex.schema.createTable('customers', table =>
    {
        table.increments('id', { primaryKey: true }).unsigned();
        table.string('name', 400).notNullable();
        table.integer('organization_id').unsigned().notNullable();
        table.integer('minutes_available').unsigned().notNullable();
        table.string('username', 140).notNullable().unique();
        table.string('password_hash', 400).notNullable();
        table.boolean('is_active').notNullable().defaultTo(true);
        table.datetime('registration_datetime').notNullable().defaultTo(knex.fn.now());
        table.string('last_login_token', 400).nullable();

        table.foreign('organization_id').references('id').inTable('organizations').onDelete('CASCADE').onUpdate('CASCADE');
    });

    await knex.schema.createTable('customers_blacklisted_tokens', table =>
    {
        table.increments('id', { primaryKey: true }).unsigned();
        table.integer('customer_id').unsigned().notNullable();
        table.string('token', 400).notNullable();

        table.foreign('customer_id').references('id').inTable('customers').onDelete('CASCADE').onUpdate('CASCADE');
    });

    await knex.schema.createTable('translation_sessions', table =>
    {
        table.increments('id', { primaryKey: true }).unsigned();
        table.datetime('begin').notNullable();
        table.datetime('end').notNullable();
        table.integer('interpreter_id').unsigned().nullable();
        table.integer('customer_id').unsigned().nullable();
        table.integer('evaluation_points').nullable();
        table.integer('guests').notNullable().defaultTo(0);
    });

    await knex.schema.createTable('session_schedules', table =>
    {
        table.increments('id', { primaryKey: true }).unsigned();
        table.dateTime('scheduled_datetime').notNullable();
        table.integer('interpreter_id').unsigned().nullable();
        table.integer('customer_id').unsigned().notNullable();

        table.foreign('interpreter_id').references('id').inTable('interpreters').onDelete('SET NULL').onUpdate('CASCADE');
        table.foreign('customer_id').references('id').inTable('customers').onDelete('CASCADE').onUpdate('CASCADE');
    });

    await knex.schema.createTable('helpdesk_calls', table =>
    {
        table.increments('id', { primaryKey: true }).unsigned();
        table.integer('customer_id').unsigned().notNullable();
        table.string('title', 280).notNullable();
        table.string('status', 100).notNullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

        table.foreign('customer_id').references('id').inTable('customers').onDelete('CASCADE').onUpdate('CASCADE');
    });

    await knex.schema.createTable('helpdesk_messages', table =>
    {
        table.increments('id', { primaryKey: true }).unsigned();
        table.integer('helpdesk_call_id').unsigned().notNullable();
        table.text('message').notNullable();
        table.string('sender_name', 400).notNullable();
        table.string('sender_type', 100).notNullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

        table.foreign('helpdesk_call_id').references('id').inTable('helpdesk_calls').onDelete('CASCADE').onUpdate('CASCADE');
    });
}


export async function down(knex: Knex): Promise<void> 
{
    await knex.schema.dropTable('helpdesk_messages');
    await knex.schema.dropTable('helpdesk_calls');
    await knex.schema.dropTable('session_schedules');
    await knex.schema.dropTable('translation_sessions');
    await knex.schema.dropTable('customers_blacklisted_tokens');
    await knex.schema.dropTable('customers');
    await knex.schema.dropTable('organizations');
    await knex.schema.dropTable('interpreters');
}

