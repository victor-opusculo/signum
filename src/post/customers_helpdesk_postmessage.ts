import { Request, Response, Router, NextFunction, urlencoded } from "express";
import { Customer } from "../lib/model/customers/Customer";
import connection from "../lib/model/database/connection";
import { HelpdeskMessage } from "../lib/model/helpdesk/HelpdeskMessage";
import { HelpdeskCall } from "../lib/model/helpdesk/HelpdeskCall";

export function customers_helpdesk_postmessage(request: Request, response: Response, next: NextFunction)
{
    const router = Router();
    router.use(urlencoded({ extended: true }));
    router.post('/', async (req, res) =>
    {
        let callId: number|undefined;
        const messages: string[] = [];
        try
        {
            const custId = await Customer.checkLoginOnScript(connection(), req, res);
            const data = {...req.body};

            const cust = await new Customer({ id: custId }).getSingle(connection()) as Customer;
            const message = new HelpdeskMessage();
            message.fillPropertiesFromFormInput(data);
            message.set("sender_type", "customer");
            message.set("sender_name", cust.get("name"));
            message.set("sent_at", new Date());

            callId = message.get("helpdesk_call_id") ?? undefined;
            const call = await new HelpdeskCall({ id: callId ?? 0 }).getSingle(connection()) as HelpdeskCall;

            if (call.get("status") === "4_closed")
                throw new Error("Este chamado está fechado!");

            const mresult = await message.save(connection());
            if (mresult.newId)
            {
                messages.push("Mensagem enviada com sucesso!");
                call?.set("status", "3_customerAnswered");
                await call?.save(connection());
            }
            else
                messages.push("Erro ao salvar a mensagem.");
        }
        catch (err)
        {
            messages.push(err instanceof Error ? err.message : String(err));
        }

        return res.status(303).redirect(`/page/customers_helpdesk/${callId ? 'view/' + callId : 'home'}?messages=` + messages.join('//'));
    });
    
    router(request, response, next);
}