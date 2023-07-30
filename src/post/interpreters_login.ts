import { Request, Response, Router, NextFunction, urlencoded } from "express";
import { Interpreter } from "../lib/model/interpreters/Interpreter";
import connection from '../lib/model/database/connection';
import jwt from 'jwt-promisify';

export function interpreters_login(request: Request, response: Response, next: NextFunction)
{
    const router = Router();
    router.use(urlencoded({ extended: true }));
    router.post('/', async (req, res) =>
    {
        try
        {
            const [ passed, intrId ] = await Interpreter.login(connection(), req.body.intrUsername ?? '', req.body.intrPassword ?? '');
            if (passed)
            {
                const token = await jwt.sign({ interpreterId: intrId }, process.env.SIGNUM_INTERPRETERS_JWT_SECRET as string, { expiresIn: '12h' });
                res.cookie('interpreterToken', token);
                res.redirect('/page/interpreters/home');
            }
            else
                throw new Error("Senha inválida!");
        }
        catch (err)
        {
            return res.redirect('/page/interpreters/login?messages=' + String(err));
        }
    });
    
    router(request, response, next);
}