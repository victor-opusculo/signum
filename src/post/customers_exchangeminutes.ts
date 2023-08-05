import { Request, Response, Router, NextFunction, urlencoded } from "express";
import { Customer } from "../lib/model/customers/Customer";
import connection from "../lib/model/database/connection";
import { InvalidFormInput } from "../lib/model/exceptions/InvalidFormInput";

export function customers_exchangeminutes(request: Request, response: Response, next: NextFunction)
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
            const destId = Number(data.selDestCustomerId ?? 0);
            const minToExchange = Number(data.numMinutesToExchange ?? 0);

            const donor = await new Customer({ id: custId }).getSingle(connection()) as Customer;
            const dest = await new Customer({ id: destId }).getSingle(connection()) as Customer;

            if (donor.get("organization_id") != dest.get("organization_id"))
                throw new InvalidFormInput("Destinatário especificado pertence a outra organização!");

            if (!donor.get("minutes_available") || (donor.get("minutes_available") ?? 0) < minToExchange)
                throw new InvalidFormInput("Você não tem minutos suficientes para transferir!");

            if (donor.get("id") == dest.get("id"))
                throw new InvalidFormInput("Você não pode transferir para si mesmo.");

            const donorNewMin = (donor.get("minutes_available") ?? 0) - minToExchange;
            const destNewMin = (dest.get("minutes_available") ?? 0) + minToExchange;

            donor.set("minutes_available", donorNewMin);
            dest.set("minutes_available", destNewMin);

            const result1 = await donor.save(connection());
            const result2 = await dest.save(connection());

            if (result1.affectedRows > 0 && result2.affectedRows > 0)
                messages.push("Transferido com sucesso!");
            else
                messages.push("Nada alterado.");
        }
        catch (err)
        {
            messages.push(String(err));
        }

        return res.status(303).redirect('/page/customers/home?messages=' + messages.join('//'));
    });
    
    router(request, response, next);
}