import { Request, Response, Router, NextFunction, urlencoded } from "express";
import { Customer } from "../lib/model/customers/Customer";
import { Organization } from '../lib/model/organizations/Organization';
import connection from "../lib/model/database/connection";
import { InvalidFormInput } from "../lib/model/exceptions/InvalidFormInput";

export function organizations_distributeminutes(request: Request, response: Response, next: NextFunction)
{
    const router = Router();
    router.use(urlencoded({ extended: true }));
    router.post('/', async (req, res) =>
    {
        const messages: string[] = [];
        try
        {
            const orgId = await Organization.checkLoginOnScript(req, res);
            const data = {...req.body};
            const destId = Number(data.selDestCustomerId ?? 0);
            const minToTransfer = Number(data.numMinutesToTransfer ?? 0);

            const donor = await new Organization({ id: orgId }).getSingle(connection()) as Organization;
            const dest = await new Customer({ id: destId }).getSingle(connection()) as Customer;

            if (donor.get("id") != dest.get("organization_id"))
                throw new InvalidFormInput("Destinatário especificado pertence a outra organização!");

            if (!donor.get("minutes_available") || (donor.get("minutes_available") ?? 0) < minToTransfer)
                throw new InvalidFormInput("Esta organização não tem minutos suficientes para transferir!");

            const donorNewMin = (donor.get("minutes_available") ?? 0) - minToTransfer;
            const destNewMin = (dest.get("minutes_available") ?? 0) + minToTransfer;

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

        return res.status(303).redirect('/page/organizations/distributeminutes?messages=' + messages.join('//'));
    });
    
    router(request, response, next);
}