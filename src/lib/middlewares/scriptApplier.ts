import { Request, Response, NextFunction } from "express";
import * as scripts from '../../scripts/index.js';

export default async function scriptApplier(request: Request, response: Response, next: NextFunction)
{
    if (!(scripts as any)[request.params.scriptName])
        return response.status(404).send("Script não encontrado!");

    return await (scripts as any)[request.params.scriptName](request, response, next);
}