import { Interpreter } from "../lib/model/interpreters/Interpreter";
import { BaseController } from "./BaseController";
import connection from '../lib/model/database/connection';

export class interpreters extends BaseController
{
    protected static controllerName: string = "interpreters";

    public async home()
    {
        this._pageTitle = "Singum | Painel de intérprete";
        this._pageSubtitle = "Painel de intérprete";

        const [ intrId, intrName ] = await Interpreter.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.interpreterName = intrName;
    }

    public async login()
    {
        this._pageTitle = "Singum | Log-in de intérprete";
        this._pageSubtitle = "Log-in de intérprete";
    }

    public async editprofile()
    {
        this._pageTitle = "Singum | Editar perfil de intérprete";
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
        this._pageTitle = "Singum | Ver perfil de intérprete";
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
}