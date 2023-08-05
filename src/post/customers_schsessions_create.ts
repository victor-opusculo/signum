import { Request, Response, Router, NextFunction, urlencoded } from "express";
import { Customer } from "../lib/model/customers/Customer";
import connection from "../lib/model/database/connection";
import { SessionSchedule } from "../lib/model/translation_sessions/SessionSchedule";

export function customers_schsessions_create(request: Request, response: Response, next: NextFunction)
{
    const router = Router();
    router.use(urlencoded({ extended: true }));
    router.post('/', async (req, res) =>
    {
        const messages: string[] = [];
        try
        {
            const custId = await Customer.checkLoginOnScript(connection(), req, res);
            const data = {...req.body};

            delete data.schId;

            let sess = new SessionSchedule();
            sess.fillPropertiesFromFormInput(data);
            sess.set("customer_id", custId);

            const result = await sess.save(connection());
            if (result.newId)
                messages.push("Agendamento criado com sucesso!");
            else
                messages.push("Agendamento não criado.");
        }
        catch (err)
        {
            messages.push(String(err));
        }

        return res.status(303).redirect('/page/customers_schsessions/home?messages=' + messages.join('//'));
    });
    
    router(request, response, next);
}