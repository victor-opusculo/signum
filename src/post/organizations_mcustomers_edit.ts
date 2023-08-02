import { Request, Response, Router, NextFunction, urlencoded } from "express";
import { Customer } from "../lib/model/customers/Customer";
import connection from "../lib/model/database/connection";
import { Organization } from "../lib/model/organizations/Organization";

export function organizations_mcustomers_edit(request: Request, response: Response, next: NextFunction)
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

            let cust = new Customer({ id: data.custId, username: data.custUsername });
            if (await cust.existsUsername(connection()))
                throw new Error("Nome de usuário já existente!");

            cust = await new Customer({ id: data.custId, organization_id: orgId }).getSingleFromOrganization(connection());
            cust.fillPropertiesFromFormInput(data);
            
            if (data.txtNewPassword)
                await cust.changePassword(data.txtNewPassword);

            const result = await cust.save(connection());
            if (result.affectedRows > 0)
                messages.push("Dados alterados com sucesso!");
            else
                messages.push("Nenhum dado alterado.");
        }
        catch (err)
        {
            messages.push(String(err));
        }

        return res.status(303).redirect(`/page/organizations_mcustomers/edit/${req.query.id ?? 0}?messages=` + messages.join('//'));
    });
    
    router(request, response, next);
}