import helperFns from "../lib/helpers/helperFns";
import transformDataRows from "../lib/helpers/transformDataRows";
import { Customer } from "../lib/model/customers/Customer";
import connection from "../lib/model/database/connection";
import { SessionSchedule } from "../lib/model/translation_sessions/SessionSchedule";
import { BaseController } from "./BaseController";

export class customers_schsessions extends BaseController
{
    protected static controllerName: string = 'customers_schsessions';

    public async home()
    {
        this._pageTitle = "Signum | Sessões agendadas";
        this._pageSubtitle = "Sessões agendadas";

        const [ custId, custName, custMinutesAvailable ] = await Customer.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.customerName = custName;
        this.pageData.customerMinutes = custMinutesAvailable;

        const getter = new SessionSchedule({ customer_id: custId });
        let sessionData: any[] = [];
        try
        {        
            const sessions = await getter.getNextFromCustomer(connection());  
        
            sessionData = transformDataRows(sessions, 
            {
                'id': c => c.get("id"),
                'Horário de início': c => c.get("scheduled_datetime")?.toLocaleString(),
                'Término previsto': c => c.get("expected_end_datetime")?.toLocaleString(),
                'Intérprete definido?': c => c.get('interpreter_id') ? 'Sim' : 'Não',
                'Descrição': c => helperFns.truncateText(c.get('description') ?? '', 80)
            });
        }
        catch (err)
        {
            this._messages.push(String(err));
        }

        this.pageData.sessionData = sessionData;
    }

    public async create()
    {
        this._pageTitle = "Signum | Agendar sessão";
        this._pageSubtitle = "Agendar sessão";

        const [ custId, custName, custMinutesAvailable ] = await Customer.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.customerName = custName;
        this.pageData.customerMinutes = custMinutesAvailable;
    }

    public async view()
    {
        this._pageTitle = "Signum | Ver sessão agendada";
        this._pageSubtitle = "Ver sessão agendada";

        const [ custId, custName, custMinutesAvailable ] = await Customer.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.customerName = custName;
        this.pageData.customerMinutes = custMinutesAvailable;

        let sess: SessionSchedule|undefined;
        try
        {
            sess = await new SessionSchedule({ id: this.request.params.id ?? 0, customer_id: custId }).getSingleFromCustomer(connection());
        }
        catch (err)
        {
            this._messages.push(String(err));
        }

        this.pageData.sessObj = sess;
    }

    public async delete()
    {
        this._pageTitle = "Signum | Excluir sessão agendada";
        this._pageSubtitle = "Excluir sessão agendada";

        const [ custId, custName, custMinutesAvailable ] = await Customer.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.customerName = custName;
        this.pageData.customerMinutes = custMinutesAvailable;

        let sess: SessionSchedule|undefined;
        try
        {
            sess = await new SessionSchedule({ id: this.request.params.id ?? 0, customer_id: custId }).getSingleFromCustomer(connection());
        }
        catch (err)
        {
            this._messages.push(String(err));
        }

        this.pageData.sessObj = sess;
    }
}