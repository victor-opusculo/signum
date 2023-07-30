import { Request, Response, NextFunction } from "express";
import * as postScripts from '../../post/index.js';

export default async function postScriptApplier(request: Request, response: Response, next: NextFunction)
{
    if (request.method !== "POST")
        return response.status(405).send(`Método HTTP ${request.method} não permitido!`);

    if (!(postScripts as any)[request.params.scriptName])
        return response.status(404).send("Script POST não encontrado!");

    return await (postScripts as any)[request.params.scriptName](request, response, next);
}