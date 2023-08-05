import { Interpreter } from "../lib/model/interpreters/Interpreter";
import { BaseController } from "./BaseController";
import connection from '../lib/model/database/connection';
import { SessionSchedule } from "../lib/model/translation_sessions/SessionSchedule";
import transformDataRows from "../lib/helpers/transformDataRows";
import helperFns from "../lib/helpers/helperFns";

export class interpreters extends BaseController
{
    protected static controllerName: string = "interpreters";

    public async home()
    {
        this._pageTitle = "Signum | Painel de intérprete";
        this._pageSubtitle = "Painel de intérprete";

        const [ intrId, intrName ] = await Interpreter.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.interpreterName = intrName;
    }

    public async login()
    {
        this._pageTitle = "Signum | Log-in de intérprete";
        this._pageSubtitle = "Log-in de intérprete";
    }

    public async editprofile()
    {
        this._pageTitle = "Signum | Editar perfil de intérprete";
        this._pageSubtitle = "Editar perfil de intérprete";

        const [ intrId, intrName ] = await Interpreter.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.interpreterName = intrName;

        try
        {
            const intr = await new Interpreter({ id: intrId }).getSingle(connection()) as Interpreter;
            this.pageData.intrObj = intr;
        }
        catch (err)
        {
            this._messages.push(String(err));
        }
    }

    public async viewprofile()
    {
        this._pageTitle = "Signum | Ver perfil de intérprete";
        this._pageSubtitle = "Ver perfil de intérprete";

        const [ intrId, intrName ] = await Interpreter.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.interpreterName = intrName;

        try
        {
            const intr = await new Interpreter({ id: intrId }).getSingle(connection()) as Interpreter;
            this.pageData.intrObj = intr;
        }
        catch (err)
        {
            this._messages.push(String(err));
        }
    }

    public async waitforcall()
    {
        this._pageTitle = "Signum | Aguardando solicitação de tradução";
        this._pageSubtitle = "Aguardando solicitação de tradução";

        const [ intrId, intrName ] = await Interpreter.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.interpreterName = intrName;
        this.pageData.interpreterId = intrId;
    }

    public async sessionschedules()
    {
        this._pageTitle = "Signum | Agendamentos disponíveis";
        this._pageSubtitle = "Agendamentos disponíveis";

        const [ intrId, intrName ] = await Interpreter.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.interpreterName = intrName;
        this.pageData.interpreterId = intrId;

        const getter = new SessionSchedule();
        let sessionData: any[] = [];
        try
        {        
            const sessions = await getter.getNextWithoutInterpreter(connection());  
        
            sessionData = transformDataRows(sessions, 
            {
                'id': c => c.get("id"),
                'Horário de início': c => c.get("scheduled_datetime")?.toLocaleString(),
                'Término previsto': c => c.get("expected_end_datetime")?.toLocaleString(),
                'Cliente': c => c.otherProperties.customerName,
                'Organização': c => c.otherProperties.organizationName,
                'Descrição': c => helperFns.truncateText(c.get('description') ?? '', 80)
            });
        }
        catch (err)
        {
            this._messages.push(String(err));
        }

        this.pageData.sessionData = sessionData;
    }

    public async viewsessionschedule()
    {
        this._pageTitle = "Signum | Ver agendamento";
        this._pageSubtitle = "Ver agendamento";

        const [ intrId, intrName ] = await Interpreter.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.interpreterName = intrName;
        this.pageData.interpreterId = intrId;

        let sess: SessionSchedule|undefined;
        try
        {
            sess = await new SessionSchedule({ id: this.request.params.id ?? 0 }).getSingle(connection());
        }
        catch (err)
        {
            this._messages.push(String(err));
        }

        this.pageData.sessObj = sess;
    }

    public async mysessionschedules()
    {
        this._pageTitle = "Signum | Trabalhos agendados aceitos";
        this._pageSubtitle = "Trabalhos agendados aceitos";

        const [ intrId, intrName ] = await Interpreter.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.interpreterName = intrName;
        this.pageData.interpreterId = intrId;

        const getter = new SessionSchedule({ interpreter_id: intrId });
        let sessionData: any[] = [];
        try
        {        
            const sessions = await getter.getNextFromInterpreter(connection());  
        
            sessionData = transformDataRows(sessions, 
            {
                'id': c => c.get("id"),
                'Horário de início': c => c.get("scheduled_datetime")?.toLocaleString(),
                'Término previsto': c => c.get("expected_end_datetime")?.toLocaleString(),
                'Cliente': c => c.otherProperties.customerName,
                'Organização': c => c.otherProperties.organizationName,
                'Descrição': c => helperFns.truncateText(c.get('description') ?? '', 80)
            });
        }
        catch (err)
        {
            this._messages.push(String(err));
        }

        this.pageData.sessionData = sessionData;
    }
}