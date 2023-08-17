import { Request, Response, Router, NextFunction } from "express";
import { Organization, recoverPasswordMessage } from "../lib/model/organizations/Organization";
import connection from "../lib/model/database/connection";
import transporter from '../lib/email/transporter';
import querystring from 'querystring';

export function organizations_recoverpassword_sendemail(request: Request, response: Response, next: NextFunction)
{
    const router = Router();
    router.get('/', async (req, res) =>
    {
        const messages: string[] = [];
        const query: any = {};
        try
        {
            const getter = new Organization({ email: req.query.email ?? '' });

            if (await getter.existsEmail(connection()))
            {
                const org = await getter.getSingleByEmail(connection());
                const otp = await org.createRecoverPasswordOtp();

                const saveRes = await org.save(connection());
                if (saveRes.affectedRows > 0)
                {
                    const result = await transporter().sendMail(recoverPasswordMessage(org, otp.toString()));
                    query.otp_organization_id = org.get("id");
                    messages.push("Código enviado com sucesso!");
                }
                else
                    throw new Error("Erro ao gerar código!");
            }
            else
                throw new Error("E-mail não localizado!");
        }
        catch (err)
        {
            messages.push(err instanceof Error ? err.message : String(err));
        }

        return res.redirect('/page/organizations/recoverpassword?messages=' + messages.join('//') + '&' + querystring.stringify(query));
    });
    
    router(request, response, next);
}