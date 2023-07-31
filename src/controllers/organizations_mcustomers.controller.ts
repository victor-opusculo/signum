import transformDataRows from "../lib/helpers/transformDataRows";
import { Customer } from "../lib/model/customers/Customer";
import connection from "../lib/model/database/connection";
import { Organization } from "../lib/model/organizations/Organization";
import { BaseController } from "./BaseController";

export class organizations_mcustomers extends BaseController
{
    protected static controllerName: string = 'organizations_mcustomers';

    public async home()
    {
        this._pageTitle = "Signum | Gerenciar clientes";
        this._pageSubtitle = "Gerenciar clientes";

        const [ orgId, orgName ] = await Organization.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.organizationName = orgName;

        const itemsOnpage = 20;
        const getter = new Customer({ organization_id: orgId });
        const customersCount = await getter.getCountFromOrganization(connection(), String(this.request.query.q ?? ''));
        const customers = await getter.getMultipleFromOrganization(connection(), String(this.request.query.q ?? ''), String(this.request.query.order_by ?? ''), Number.parseInt(String(this.request.query.page_num ?? 1)), itemsOnpage);  
    
        const transformed = transformDataRows(customers, 
        {
            'id': c => c.get("id"),
            'Nome': c => c.get("name"),
            'Usuário': c => c.get("username"),
            'Minutos disponíveis': c => c.get("minutes_available")
        });

        this.pageData.customersData = transformed;
        this.pageData.customersCount = customersCount;
        this.pageData.itemsOnpage = itemsOnpage;
    
    }
}