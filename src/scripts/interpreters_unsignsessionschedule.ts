import { Request, Response, Router, NextFunction } from "express";
import { Interpreter } from "../lib/model/interpreters/Interpreter";
import { SessionSchedule } from "../lib/model/translation_sessions/SessionSchedule";
import connection from "../lib/model/database/connection";

export function interpreters_unsignsessionschedule(request: Request, response: Response, next: NextFunction)
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

            if (sess.get("interpreter_id") != intrId)
                throw new Error("Este agendamento foi aceito por outro intérprete.");

            sess.set("interpreter_id", null);
            sess.set("room_id", null);
            
            const result = await sess.save(connection());
            if (result.affectedRows > 0)
                messages.push("Trabalho agendado cancelado!");
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