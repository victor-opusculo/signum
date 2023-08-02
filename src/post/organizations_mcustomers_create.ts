import { Request, Response, Router, NextFunction, urlencoded } from "express";
import { Customer } from "../lib/model/customers/Customer";
import connection from "../lib/model/database/connection";
import { Organization } from "../lib/model/organizations/Organization";

export function organizations_mcustomers_create(request: Request, response: Response, next: NextFunction)
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

            delete data.custOrganizationId;
            delete data.custMinutes;

            let cust = new Customer({ id: 0, username: data.custUsername });
            if (await cust.existsUsername(connection()))
                throw new Error("Nome de usuário já existente!");

            cust = new Customer({ organization_id: orgId });
            cust.fillPropertiesFromFormInput(data);
            cust.set("minutes_available", 0);
            cust.set("registration_datetime", new Date());
            
            await cust.changePassword(data.txtPassword);

            const result = await cust.save(connection());
            if (result.affectedRows > 0)
                messages.push("Cliente criado com sucesso!");
            else
                messages.push("Cliente não criado!");
        }
        catch (err)
        {
            messages.push(String(err));
        }

        return res.status(303).redirect(`/page/organizations_mcustomers/home?messages=` + messages.join('//'));
    });
    
    router(request, response, next);
}