import { Request, Response, Router, NextFunction } from "express";

export function interpreters_logoff(request: Request, response: Response, next: NextFunction)
{
    const router = Router();
    router.get('/', async (req, res) =>
    {
        res.clearCookie('interpreterToken');
        res.redirect('/page/interpreters/login');
    });
    
    router(request, response, next);
}