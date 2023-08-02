import { Interpreter } from "../lib/model/interpreters/Interpreter";
import { BaseController } from "./BaseController";
import connection from '../lib/model/database/connection';

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
}