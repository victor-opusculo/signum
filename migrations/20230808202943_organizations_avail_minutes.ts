import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> 
{
    await knex.schema.alterTable('organizations', table =>
    {
        table.integer('minutes_available').notNullable();
        table.string('recover_password_hash', 280).nullable();
        table.datetime('recover_password_expiry').nullable();
    });
}


export async function down(knex: Knex): Promise<void> 
{
    await knex.schema.alterTable('organizations', table =>
    {
        table.dropColumn('minutes_available');
        table.dropColumn('recover_password_hash');
        table.dropColumn('recover_password_expiry');
    });
}

