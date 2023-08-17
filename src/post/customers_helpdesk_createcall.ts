import { Request, Response, Router, NextFunction, urlencoded } from "express";
import { Customer } from "../lib/model/customers/Customer";
import connection from "../lib/model/database/connection";
import { HelpdeskCall } from "../lib/model/helpdesk/HelpdeskCall";
import { HelpdeskMessage } from "../lib/model/helpdesk/HelpdeskMessage";

export function customers_helpdesk_createcall(request: Request, response: Response, next: NextFunction)
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

            const call = new HelpdeskCall();
            call.fillPropertiesFromFormInput(data);
            call.set("customer_id", custId);
            call.set("status", "1_open");
            call.set("created_at_dt", new Date());
            
            const cresult = await call.save(connection());
            if (cresult.newId)
            {
                const cust = await new Customer({ id: custId }).getSingle(connection()) as Customer;
                const message = new HelpdeskMessage({ helpdesk_call_id: cresult.newId });
                message.fillPropertiesFromFormInput(data);
                message.set("helpdesk_call_id", cresult.newId);
                message.set("sender_type", "customer");
                message.set("sender_name", cust.get("name"));
                message.set("sent_at", new Date());

                const mresult = await message.save(connection());
                if (mresult.newId)
                    messages.push("Chamado aberto com sucesso!");
                else
                    messages.push("Erro ao salvar primeira mensagem.");
            }
            else
                messages.push("Chamado não criado.");
        }
        catch (err)
        {
            messages.push(err instanceof Error ? err.message : String(err));
        }

        return res.status(303).redirect('/page/customers_helpdesk/home?messages=' + messages.join('//'));
    });
    
    router(request, response, next);
}