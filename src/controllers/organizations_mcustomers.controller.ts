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
            'Minutos disponíveis': c => c.get("minutes_available"),
            'Ativo?': c => c.get("is_active") ? 'Sim' : 'Não'
        });

        this.pageData.customersData = transformed;
        this.pageData.customersCount = customersCount;
        this.pageData.itemsOnpage = itemsOnpage;
    
    }

    public async create()
    {
        this._pageTitle = "Signum | Criar cliente";
        this._pageSubtitle = "Criar cliente";

        const [ orgId, orgName ] = await Organization.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.organizationName = orgName;
    }

    public async edit()
    {
        this._pageTitle = "Signum | Editar cliente";
        this._pageSubtitle = "Editar cliente";

        const [ orgId, orgName ] = await Organization.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.organizationName = orgName;

        let customer: Customer|undefined;

        try
        {
            const custId = this.request.params.id ?? 0;
            const getter = new Customer({ id: custId, organization_id: orgId });
            customer = await getter.getSingleFromOrganization(connection());
        }
        catch (err)
        {
            if (err instanceof Error)
                this._messages.push(err.message);
        }
    
        this.pageData.custObj = customer;
    }

    public async delete()
    {
        this._pageTitle = "Signum | Excluir cliente";
        this._pageSubtitle = "Excluir cliente";

        const [ orgId, orgName ] = await Organization.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.organizationName = orgName;

        let customer: Customer|undefined;

        try
        {
            const custId = this.request.params.id ?? 0;
            const getter = new Customer({ id: custId, organization_id: orgId });
            customer = await getter.getSingleFromOrganization(connection());
        }
        catch (err)
        {
            if (err instanceof Error)
                this._messages.push(err.message);
        }
    
        this.pageData.custObj = customer;
    }
}