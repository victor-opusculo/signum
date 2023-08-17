import { Request, Response, Router, NextFunction } from "express";
import { Organization } from "../lib/model/organizations/Organization";
import connection from "../lib/model/database/connection";
import { InvalidOtp } from "../lib/model/exceptions/InvalidOtp";
import querystring from 'querystring';

export function organizations_recoverpassword_checkotp(request: Request, response: Response, next: NextFunction)
{
    const router = Router();
    router.get('/', async (req, res) =>
    {
        const messages: string[] = [];
        const query: any = {};
        try
        {
            const givenOtp = String(req.query.otp ?? '***');
            const orgId = req.query.organizationId ?? 0;
            const org = await new Organization({ id: orgId }).getSingle(connection()) as Organization;

            await org.checkRecoverPasswordOtp(givenOtp);

            res.cookie('organizationRecPasswordOtp', givenOtp);
            res.cookie('organizationRecPasswordId', orgId);
        }
        catch (err)
        {
            if (err instanceof InvalidOtp)
                query.otp_organization_id = req.query.organization_id ?? 0;

            messages.push(err instanceof Error ? err.message : String(err));
        }

        return res.redirect('/page/organizations/recoverpassword?messages=' + messages.join('//') + '&' + querystring.stringify(query));
    });
    
    router(request, response, next);
}