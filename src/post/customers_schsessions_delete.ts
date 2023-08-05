import { Request, Response, Router, NextFunction, urlencoded } from "express";
import { Customer } from "../lib/model/customers/Customer";
import connection from "../lib/model/database/connection";
import { SessionSchedule } from "../lib/model/translation_sessions/SessionSchedule";

export function customers_schsessions_delete(request: Request, response: Response, next: NextFunction)
{
    const router = Router();
    router.use(urlencoded({ extended: true }));
    router.post('/', async (req, res) =>
    {
        const messages: string[] = [];
        try
        {
            const custId = await Customer.checkLoginOnScript(connection(), req, res);
            let sess = await new SessionSchedule({ id: req.query.id ?? 0, customer_id: custId }).getSingleFromCustomer(connection());
            const result = await sess.del(connection());

            if (result.affectedRows > 0)
                messages.push("Agendamento excluído com sucesso!");
            else
                messages.push("Agendamento não excluído.");
        }
        catch (err)
        {
            messages.push(String(err));
        }

        return res.status(303).redirect('/page/customers_schsessions/home?messages=' + messages.join('//'));
    });
    
    router(request, response, next);
}