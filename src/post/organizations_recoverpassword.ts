import { Request, Response, Router, NextFunction, urlencoded } from "express";
import { Organization } from "../lib/model/organizations/Organization";
import connection from '../lib/model/database/connection';
import jwt from 'jwt-promisify';

export function organizations_recoverpassword(request: Request, response: Response, next: NextFunction)
{
    const router = Router();
    router.use(urlencoded({ extended: true }));
    router.post('/', async (req, res) =>
    {
        const messages: string[] = [];
        try
        {
            const orgId = req.cookies.organizationRecPasswordId ?? 0;
            const otp = req.cookies.organizationRecPasswordOtp ?? '***';
            const newPassword = req.body.newPassword;

            if (!newPassword)
                throw new Error("Senha nova não informada!");

            const org = await new Organization({ id: orgId }).getSingle(connection()) as Organization;

            await org.checkRecoverPasswordOtp(otp);
            await org.changePassword(newPassword);

            const result = await org.save(connection());
            if (result.affectedRows > 0)
            {
                messages.push("Senha alterada com sucesso!");
                res.clearCookie('organizationRecPasswordOtp');
                res.clearCookie('organizationRecPasswordId');
            }
            else
                throw new Error("Senha não alterada!");
        }
        catch (err)
        {
            messages.push(err instanceof Error ? err.message : String(err));
        }

        return res.redirect('/page/organizations/recoverpassword?messages=' + messages.join('//'));
    });
    
    router(request, response, next);
}