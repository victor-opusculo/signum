import connection from "../lib/model/database/connection";
import { Organization } from "../lib/model/organizations/Organization";
import { BaseController } from "./BaseController";

export class organizations extends BaseController
{
    protected static controllerName: string = 'organizations';

    public async home()
    {
        this._pageTitle = "Signum | Painel de organização";
        this._pageSubtitle = "Painel de organização";

        const [ orgId, orgName ] = await Organization.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.organizationName = orgName;
    }

    public async login()
    {
        this._pageTitle = "Signum | Log-in de organização";
        this._pageSubtitle = "Log-in de organização";
    }

    public async editprofile()
    {
        this._pageTitle = "Signum | Editar perfil de organização";
        this._pageSubtitle = "Editar perfil de organização";

        const [ orgId, orgName ] = await Organization.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.organizationName = orgName;

        try
        {
            const org = await new Organization({ id: orgId }).getSingle(connection()) as Organization;
            this.pageData.orgObj = org;
        }
        catch (err)
        {
            this._messages.push(String(err));
        }
    }

    public async viewprofile()
    {
        this._pageTitle = "Signum | Ver perfil de organização";
        this._pageSubtitle = "Ver perfil de organização";

        const [ orgId, orgName ] = await Organization.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.organizationName = orgName;

        try
        {
            const org = await new Organization({ id: orgId }).getSingle(connection()) as Organization;
            this.pageData.orgObj = org;
        }
        catch (err)
        {
            this._messages.push(String(err));
        }
    }
}