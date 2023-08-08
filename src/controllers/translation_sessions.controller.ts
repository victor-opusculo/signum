import { Customer } from "../lib/model/customers/Customer";
import connection from "../lib/model/database/connection";
import { CustomerZeroMinutes } from "../lib/model/exceptions/CustomerZeroMinutes";
import { RedirectTo } from "../lib/model/exceptions/RedirectTo";
import { Interpreter } from "../lib/model/interpreters/Interpreter";
import { BaseController } from "./BaseController";
import jwt from 'jwt-promisify';
import { v4 as uuidv4 } from 'uuid';

export class translation_sessions extends BaseController
{
    protected static controllerName: string = 'translation_sessions';

    public async room()
    {
        this._pageTitle = 'Signum | Sessão';
        this._pageSubtitle = 'Sessão';

        const roomId = this.request.params.id || undefined;

        let relatedCustomerId: number|undefined;
        if (this.request.query.related_customer_id)
            relatedCustomerId = Number(this.request.query.related_customer_id)

        if (!roomId)
            return this.response.redirect('/homepage/home?messages=' + 'ID de sala não presente!');

        const intrToken = this.request.cookies.interpreterToken ?? '';
        const customerToken = this.request.cookies.customerToken ?? '';
        
        let interpreterPl: Record<string, any>|null = null; 
        let customerPl: Record<string, any>|null = null; 
        let screenName: string = '';

        try 
        { 
            interpreterPl = await jwt.verify(intrToken, process.env.SIGNUM_INTERPRETERS_JWT_SECRET as string); 
            const intr = await new Interpreter({ id: interpreterPl?.interpreterId }).getSingle(connection()) as Interpreter;
            screenName = intr.get("name") ?? '(sem nome)';
        }
        catch (err) { interpreterPl = null; }

        if (!interpreterPl)
        {
            try 
            { 
                customerPl = await jwt.verify(customerToken, process.env.SIGNUM_CUSTOMERS_JWT_SECRET as string); 
                const cust = await new Customer({ id: customerPl?.customerId }).getSingle(connection()) as Customer;
                screenName = cust.get("name") ?? '(sem nome)';
                
                if (!cust.hasMinutesAvailable())
                    throw new CustomerZeroMinutes(undefined, cust.get("minutes_available") ?? 0, `/page/homepage/home?messages=Seu saldo de minutos está esgotado!`);
            }
            catch (err) 
            { 
                customerPl = null; 
                if (err instanceof CustomerZeroMinutes)
                    throw err;
            }
        }
        
        if (interpreterPl)
            this.pageData.userData =
            {
                type: 'interpreter',
                token: intrToken,
                screenName,
                id: interpreterPl.interpreterId
            };
        else if (customerPl)
            this.pageData.userData =
            {
                type: 'customer',
                token: customerToken,
                screenName,
                id: customerPl.customerId
            }
        else
            this.pageData.userData =
            {
                type: 'guest',
                screenName: 'Visitante',
                relatedCustomerId: relatedCustomerId ?? ''
            };

        this.pageData.roomId = roomId;
    }

    public async guestsession()
    {
        const relatedCustomerId = Number(this.request.params.id ?? '***');
        const custExists = await new Customer({ id: relatedCustomerId }).existsId(connection());

        if (custExists)
            throw new RedirectTo(`/page/translation_sessions/room/${uuidv4()}?related_customer_id=${relatedCustomerId}`);
        else
            throw new RedirectTo(`/page/homepage/home?messages=Cliente informado não localizado`);
    }
}