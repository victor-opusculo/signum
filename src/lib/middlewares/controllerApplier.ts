import { Request, Response } from "express";
import * as controllers from '../../controllers/index.js';
import helperFns from "../helpers/helperFns.js";
import { Organization } from "../model/organizations/Organization.js";
import connection from "../model/database/connection.js";


export default async function controllerApplier(request: Request, response: Response)
{
    if (request.method !== "GET")
        return response.status(405).send(`Método HTTP ${request.method} não permitido!`);

    if (!(controllers as any)[request.params.controller])
        return response.status(404).send("Página não encontrada!");

    const loadedOrganization = await Organization.loadOrganizationDataByCustomerId(connection(), request, response);

    try
    {
        const cont = new (controllers as any)[request.params.controller](request, response);
        await cont.runAction(request.params.action ?? 'home');
        response.render('index', { loadedOrganization, request, response, controller: cont, idParam: request.params.id ?? undefined, pageMessages: cont.pageMessages, helperFns });
    }
    catch (err)
    {
        if (typeof err === "object" && (err as any).redirectTo)
            response.redirect((err as any).redirectTo);
        else if (err instanceof Error)
            response.status(500).send(process.env.NODE_ENV === 'development' ? err.message : 'Erro ao carregar página!');
        else 
            response.status(500).send('Erro ao carregar página!');
    }
}