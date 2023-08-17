import { Request, Response, Router, NextFunction, urlencoded } from "express";
import { Customer } from "../lib/model/customers/Customer";
import { Organization } from '../lib/model/organizations/Organization';
import connection from "../lib/model/database/connection";
import { InvalidFormInput } from "../lib/model/exceptions/InvalidFormInput";

export function organizations_seizeminutes(request: Request, response: Response, next: NextFunction)
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
            const affectId = Number(data.selAffectedCustomerId ?? 0);
            const minToTransfer = Number(data.numMinutesToSeize ?? 0);

            const donor = await new Customer({ id: affectId }).getSingle(connection()) as Customer;
            const dest = await new Organization({ id: orgId }).getSingle(connection()) as Organization;

            if (dest.get("id") != donor.get("organization_id"))
                throw new InvalidFormInput("Cliente especificado pertence a outra organização!");

            if (!donor.get("minutes_available") || (donor.get("minutes_available") ?? 0) < minToTransfer)
                throw new InvalidFormInput("Este cliente não tem minutos suficientes para confiscar!");

            const donorNewMin = (donor.get("minutes_available") ?? 0) - minToTransfer;
            const destNewMin = (dest.get("minutes_available") ?? 0) + minToTransfer;

            donor.set("minutes_available", donorNewMin);
            dest.set("minutes_available", destNewMin);

            const result1 = await donor.save(connection());
            const result2 = await dest.save(connection());

            if (result1.affectedRows > 0 && result2.affectedRows > 0)
                messages.push("Minutos confiscados com sucesso!");
            else
                messages.push("Nada alterado.");
        }
        catch (err)
        {
            messages.push(String(err));
        }

        return res.status(303).redirect('/page/organizations/seizeminutes?messages=' + messages.join('//'));
    });
    
    router(request, response, next);
}