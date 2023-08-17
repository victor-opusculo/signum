import transformDataRows from "../lib/helpers/transformDataRows";
import { Customer } from "../lib/model/customers/Customer";
import connection from "../lib/model/database/connection";
import { HelpdeskCall } from "../lib/model/helpdesk/HelpdeskCall";
import { BaseController } from "./BaseController";

export class customers_helpdesk extends BaseController
{
    protected static controllerName: string = 'customers_helpdesk';

    public async home()
    {
        this._pageTitle = "Signum | Suporte";
        this._pageSubtitle = "Suporte";

        const [ custId, custName, custMinutesAvailable ] = await Customer.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.customerName = custName;
        this.pageData.customerMinutes = custMinutesAvailable;

        const itemsOnPage = 20;
        const searchKeywords: string = this.request.query.q ? String(this.request.query.q) : '';
        const orderBy: string = this.request.query.order_by ? String(this.request.query.order_by) : '';
        const pageNum: number = this.request.query.page_num ? Number.parseInt(String(this.request.query.page_num)) : 1;
        let callCount: number = 0;
        let calls: any[] = [];
        try
        {
            const getter = new HelpdeskCall({ customer_id: custId });
            callCount = await getter.getCountFromCustomer(connection(), searchKeywords);
            const callsObjs = await getter.getMultipleFromCustomer(connection(), searchKeywords, orderBy, pageNum, itemsOnPage);
            
            calls = transformDataRows(callsObjs, 
            {
                'id': c => c.get("id"),
                'Título': c => c.get("title"),
                'Status': c => c.translateStatus(),
                'Abertura': c => c.get("created_at_dt")?.toLocaleString()
            });
        }
        catch (err)
        {
            this._messages.push(err instanceof Error ? err.message : String(err));
        }

        this.pageData.callCount = callCount;
        this.pageData.calls = calls;
        this.pageData.itemsOnPage = itemsOnPage;
    }

    public async createcall()
    {
        this._pageTitle = "Signum | Abrir chamado";
        this._pageSubtitle = "Abrir chamado";

        const [ custId, custName, custMinutesAvailable ] = await Customer.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.customerName = custName;
        this.pageData.customerMinutes = custMinutesAvailable;
    }

    public async view()
    {
        this._pageTitle = "Signum | Ver chamado";
        this._pageSubtitle = "Ver chamado";

        const [ custId, custName, custMinutesAvailable ] = await Customer.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.customerName = custName;
        this.pageData.customerMinutes = custMinutesAvailable;

        const callId = Number(this.request.params.id ?? 0);
        let call: HelpdeskCall|undefined;
        try
        {
            call = await new HelpdeskCall({ id: callId }).getSingle(connection()) as HelpdeskCall;
            await call.fetchMessages(connection());
        }
        catch (err)
        {
            this._messages.push(err instanceof Error ? err.message : String(err));
        }

        this.pageData.call = call;
    }

    public async postmessage()
    {
        this._pageTitle = "Signum | Postar resposta ao chamado";
        this._pageSubtitle = "Postar resposta ao chamado";

        const [ custId, custName, custMinutesAvailable ] = await Customer.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.customerName = custName;
        this.pageData.customerMinutes = custMinutesAvailable;

        const callId = Number(this.request.params.id ?? 0);
        let call: HelpdeskCall|undefined;
        try
        {
            call = await new HelpdeskCall({ id: callId }).getSingle(connection()) as HelpdeskCall;
        }
        catch (err)
        {
            this._messages.push(err instanceof Error ? err.message : String(err));
        }

        this.pageData.call = call;
    }
}