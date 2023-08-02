import { BaseController } from "./BaseController";
import jwt from 'jwt-promisify';

export class translation_sessions extends BaseController
{
    protected static controllerName: string = 'translation_sessions';

    public async room()
    {
        const roomId = this.request.params.id || undefined;

        if (!roomId)
            return this.response.redirect('/homepage/home?messages=' + 'ID de sala não presente!');

        const intrToken = this.request.cookies.interpreterToken ?? '';
        const customerToken = this.request.cookies.customerToken ?? '';
        
        let interpreterPl: Record<string, any>|null; 
        let customerPl: Record<string, any>|null; 
        
        try { interpreterPl = await jwt.verify(intrToken, process.env.SIGNUM_INTERPRETERS_JWT_SECRET as string); }
        catch (err) { interpreterPl = null; }

        try { customerPl = await jwt.verify(customerToken, process.env.SIGNUM_CUSTOMERS_JWT_SECRET as string); }
        catch (err) { customerPl = null; }
        
        if (interpreterPl)
            this.pageData.userData =
            {
                type: 'interpreter',
                token: intrToken,
                id: interpreterPl.interpreterId
            };
        else if (customerPl)
            this.pageData.userData =
            {
                type: 'customer',
                token: customerToken,
                id: customerPl.customerId
            }
        else
            this.pageData.userData =
            {
                type: 'guest'
            };

        this.pageData.roomId = roomId;
    }
}