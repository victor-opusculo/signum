import { Request, Response, Router, NextFunction, urlencoded } from "express";
import { Customer } from "../lib/model/customers/Customer";
import connection from '../lib/model/database/connection';
import jwt from 'jwt-promisify';

export function customers_login(request: Request, response: Response, next: NextFunction)
{
    const router = Router();
    router.use(urlencoded({ extended: true }));
    router.post('/', async (req, res) =>
    {
        try
        {
            const [ passed, custId ] = await Customer.login(connection(), req.body.custUsername ?? '', req.body.custPassword ?? '');
            if (passed)
            {
                const token = await jwt.sign({ customerId: custId }, process.env.SIGNUM_CUSTOMERS_JWT_SECRET as string, { expiresIn: '12h' });
                Customer.registerAuthToken(connection(), custId, token);
                res.cookie('customerToken', token);
                res.redirect('/page/customers/home');
            }
            else
                throw new Error("Senha inválida!");
        }
        catch (err)
        {
            return res.redirect('/page/customers/login?messages=' + String(err));
        }
    });
    
    router(request, response, next);
}