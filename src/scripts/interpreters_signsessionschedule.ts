import { Request, Response, Router, NextFunction } from "express";
import { Interpreter } from "../lib/model/interpreters/Interpreter";
import { SessionSchedule } from "../lib/model/translation_sessions/SessionSchedule";
import connection from "../lib/model/database/connection";
import { v4 as uuidv4 } from 'uuid';

export function interpreters_signsessionschedule(request: Request, response: Response, next: NextFunction)
{
    const router = Router();
    router.get('/', async (req, res) =>
    {
        const messages: string[] = [];
        try
        {
            const intrId = await Interpreter.checkLoginOnScript(req, res);
            const schId = req.query.id ? Number(req.query.id) : 0;

            const sess = await new SessionSchedule({ id: schId }).getSingle(connection());

            if (sess.get("interpreter_id"))
                throw new Error("Este agendamento já tem um intérprete definido.");

            sess.set("interpreter_id", intrId);
            sess.set("room_id", uuidv4());
            
            const result = await sess.save(connection());
            if (result.affectedRows > 0)
                messages.push("Trabalho agendado aceito!");
            else
                messages.push("Nada alterado.");
        }
        catch (err)
        {
            messages.push(String(err));
        }

        res.status(303).redirect('/page/interpreters/mysessionschedules?messages=' + messages.join('//'))
    });
    
    router(request, response, next);
}