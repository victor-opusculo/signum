import { Request, Response, Router, NextFunction, urlencoded } from "express";
import { Organization } from "../lib/model/organizations/Organization";
import connection from '../lib/model/database/connection';
import jwt from 'jwt-promisify';

export function organizations_login(request: Request, response: Response, next: NextFunction)
{
    const router = Router();
    router.use(urlencoded({ extended: true }));
    router.post('/', async (req, res) =>
    {
        try
        {
            const [ passed, orgId ] = await Organization.login(connection(), req.body.orgUsername ?? '', req.body.orgPassword ?? '');
            if (passed)
            {
                const token = await jwt.sign({ organizationId: orgId }, process.env.SIGNUM_ORGANIZATIONS_JWT_SECRET as string, { expiresIn: '12h' });
                res.cookie('organizationToken', token);
                res.redirect('/page/organizations/home');
            }
            else
                throw new Error("Senha inválida!");
        }
        catch (err)
        {
            return res.redirect('/page/organizations/login?messages=' + String(err));
        }
    });
    
    router(request, response, next);
}