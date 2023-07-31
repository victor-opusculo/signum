import { Customer } from "../lib/model/customers/Customer";
import { BaseController } from "./BaseController";
import connection from '../lib/model/database/connection';

export class customers extends BaseController
{
    protected static controllerName: string = "customers";

    public async home()
    {
        this._pageTitle = "Signum | Painel de cliente";
        this._pageSubtitle = "Painel de cliente";

        const [ custId, custName ] = await Customer.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.customerName = custName;
    }

    public async login()
    {
        this._pageTitle = "Signum | Log-in de cliente";
        this._pageSubtitle = "Log-in de cliente";
    }

    public async editprofile()
    {
        this._pageTitle = "Signum | Editar perfil de cliente";
        this._pageSubtitle = "Editar perfil de cliente";

        const [ custId, custName ] = await Customer.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.customerName = custName;

        try
        {
            const cust = await new Customer({ id: custId }).getSingle(connection()) as Customer;
            this.pageData.custObj = cust;
        }
        catch (err)
        {
            this._messages.push(String(err));
        }
    }
}