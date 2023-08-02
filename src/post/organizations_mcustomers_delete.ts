import { Request, Response, Router, NextFunction, urlencoded } from "express";
import { Customer } from "../lib/model/customers/Customer";
import connection from "../lib/model/database/connection";
import { Organization } from "../lib/model/organizations/Organization";

export function organizations_mcustomers_delete(request: Request, response: Response, next: NextFunction)
{
    const router = Router();
    router.use(urlencoded({ extended: true }));
    router.post('/', async (req, res) =>
    {
        const messages: string[] = [];
        try
        {
            const custId = req.query.id ?? 0;
            const orgId = await Organization.checkLoginOnScript(req, res);
            const cust = await new Customer({ id: custId, organization_id: orgId }).getSingleFromOrganization(connection());

            const result = await cust.del(connection());
            if (result.affectedRows > 0)
                messages.push("Cliente excluído com sucesso!");
            else
                messages.push("Cliente não excluído!");
        }
        catch (err)
        {
            messages.push(String(err));
        }

        return res.status(303).redirect(`/page/organizations_mcustomers/home?messages=` + messages.join('//'));
    });
    
    router(request, response, next);
}