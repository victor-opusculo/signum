import { Knex } from "knex";
import bcrypt from 'bcrypt';
import * as fs from 'fs/promises';
import { existsSync } from "fs";

export async function seed(knex: Knex): Promise<void> 
{
    await knex("interpreters").del();
    await knex("interpreters").insert(
    [
        {
            id: 1, 
            name: "Victor Opusculo Oliveira Ventura de Almeida",
            description: "Teste",
            photo_filename: '1.jpg',
            signorum_main_intr_id: 1,
            username: 'victor',
            password_hash: bcrypt.hashSync('123456789', 10)
        },
    ]);

    if (existsSync('./public/interpreters/1.jpg'))
        await fs.unlink('./public/interpreters/1.jpg');
    await fs.copyFile('./seeds/resources/victor.jpg', './public/uploads/interpreters/1.jpg');

    await knex("organizations").del();
    await knex("organizations").insert(
    [
        {
            id: 1,
            name: "Câmara Municipal de Itapevi",
            email: "escoladoparlamento@itapevi.sp.leg.br",
            other_infos_json: '[{"label":"Teste", "value": "teste" }]',
            username: 'camaraitapevi',
            password_hash: bcrypt.hashSync('123456789', 10),
            logo_filename: '1.jpg'
        }
    ]);

    if (existsSync('./public/organizations/1.jpg'))
        await fs.unlink('./public/organizations/1.jpg');
    await fs.copyFile('./seeds/resources/cmi.jpg', './public/uploads/organizations/1.jpg');

    await knex("customers").del();
    await knex("customers").insert(
    [
        {
            id: 1,
            name: 'V. Opus',
            organization_id: 1,
            minutes_available: 60,
            username: 'vopus',
            password_hash: bcrypt.hashSync('123456789', 10),
            is_active: 1,
            registration_datetime: new Date(),
            last_login_token: null
        }
    ]);
};
