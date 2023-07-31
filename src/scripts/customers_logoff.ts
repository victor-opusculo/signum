import { Request, Response, Router, NextFunction } from "express";
import { Customer } from "../lib/model/customers/Customer";
import connection from "../lib/model/database/connection";

export function customers_logoff(request: Request, response: Response, next: NextFunction)
{
    const router = Router();
    router.get('/', (req, res) =>
    {
        Customer.clearAuthToken(connection(), request);
        res.clearCookie('customerToken');
        res.redirect('/page/customers/login');
    });
    
    router(request, response, next);
}