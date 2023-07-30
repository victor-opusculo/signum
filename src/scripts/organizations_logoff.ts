import { Request, Response, Router, NextFunction } from "express";

export function organizations_logoff(request: Request, response: Response, next: NextFunction)
{
    const router = Router();
    router.get('/', async (req, res) =>
    {
        res.clearCookie('organizationToken');
        res.redirect('/page/organizations/login');
    });
    
    router(request, response, next);
}