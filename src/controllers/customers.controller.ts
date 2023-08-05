import { Customer } from "../lib/model/customers/Customer";
import { BaseController } from "./BaseController";
import connection from '../lib/model/database/connection';
import { v4 as uuidv4 } from 'uuid';
import { RedirectTo } from "../lib/model/exceptions/RedirectTo";
import { Interpreter } from "../lib/model/interpreters/Interpreter";
import transformDataRows from "../lib/helpers/transformDataRows";

export class customers extends BaseController
{
    protected static controllerName: string = "customers";

    public async home()
    {
        this._pageTitle = "Signum | Painel de cliente";
        this._pageSubtitle = "Painel de cliente";

        const [ custId, custName, custMinutesAvailable ] = await Customer.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.customerName = custName;
        this.pageData.customerMinutes = custMinutesAvailable;
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

        const [ custId, custName, custMinutesAvailable ] = await Customer.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.customerName = custName;
        this.pageData.customerMinutes = custMinutesAvailable;

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

    public async create_translation_session()
    {
        const [ custId, custName ] = await Customer.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.customerName = custName;

        throw new RedirectTo('/page/translation_sessions/room/' + uuidv4());
    }

    public async interpreters()
    {
        this._pageTitle = "Signum | Lista de intérpretes";
        this._pageSubtitle = "Lista de intérpretes";

        const [ custId, custName, custMinutesAvailable ] = await Customer.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.customerName = custName;
        this.pageData.customerMinutes = custMinutesAvailable;

        const itemsOnpage = 20;
        const getter = new Interpreter();
        let interpreterCount: number = 0;
        let intrData: any[] = [];
        try
        {        
            
            interpreterCount = await getter.getCount(connection(), String(this.request.query.q ?? ''));
            const interpreters = await getter.getMultiple(connection(), String(this.request.query.q ?? ''), String(this.request.query.order_by ?? ''), Number.parseInt(String(this.request.query.page_num ?? 1)), itemsOnpage);  
        
            intrData = transformDataRows(interpreters, 
            {
                'id': c => c.get("id"),
                'Nome': c => c.get("name"),
                'Usuário': c => c.get("username"),
                'Sessões trabalhadas': c => c.otherProperties.sessionsWorkedAt,
                'Minutos trabalhados': c => c.otherProperties.totalMinutes
            });
        }
        catch (err)
        {
            this._messages.push(String(err));
        }

        this.pageData.itemsOnpage = itemsOnpage;
        this.pageData.intrCount = interpreterCount;
        this.pageData.intrData = intrData;
    }

    public async view_interpreter()
    {
        this._pageTitle = "Signum | Ver intérprete";
        this._pageSubtitle = "Ver intérprete";

        const [ custId, custName, custMinutesAvailable ] = await Customer.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.customerName = custName;
        this.pageData.customerMinutes = custMinutesAvailable;

        let intr: Interpreter|undefined;

        try
        {
            const intrId = this.request.params.id;
            intr = await new Interpreter({ id: intrId }).getSingle(connection()) as Interpreter;
        }
        catch (err)
        {
            this._messages.push(String(err));
        }

        this.pageData.intrObj = intr;
    }

    public async exchangeminutes()
    {
        this._pageTitle = "Signum | Transferir minutos";
        this._pageSubtitle = "Transferir minutos";

        const [ custId, custName, custMinutesAvailable ] = await Customer.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.customerName = custName;
        this.pageData.customerId = custId;
        this.pageData.customerMinutes = custMinutesAvailable;

        const allCustomers = await new Customer({ organization_id: this._loadedOrganization?.get("id") ?? 0 })
        .getMultipleFromOrganization(connection(), '', '');

        this.pageData.allCustomers = allCustomers;
    }
}