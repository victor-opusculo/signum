import { Request, Response, Router, NextFunction, urlencoded } from "express";
import { Customer } from "../lib/model/customers/Customer";
import connection from "../lib/model/database/connection";
import { InvalidFormInput } from "../lib/model/exceptions/InvalidFormInput";

export function customers_editprofile(request: Request, response: Response, next: NextFunction)
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

            delete data.custId;
            delete data.custOrganizationId;
            delete data.custMinutes;
            delete data.custIsActive;

            let cust = new Customer({ id: custId, username: data.custUsername });
            if (await cust.existsUsername(connection()))
                throw new Error("Nome de usuário já existente!");

            cust = await new Customer({ id: custId }).getSingle(connection()) as Customer;
            cust.fillPropertiesFromFormInput(data);
            
            if (data.txtOldPassword && data.txtNewPassword)
            {
                if (!await cust.checkPassword(data.txtOldPassword))
                    throw new InvalidFormInput("Senha antiga incorreta!");

                await cust.changePassword(data.txtNewPassword);
            }

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

        return res.status(303).redirect('/page/customers/editprofile?messages=' + messages.join('//'));
    });
    
    router(request, response, next);
}