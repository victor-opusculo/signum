import transformDataRows from "../lib/helpers/transformDataRows";
import { Customer } from "../lib/model/customers/Customer";
import connection from "../lib/model/database/connection";
import { Organization } from "../lib/model/organizations/Organization";
import { TranslationSession } from "../lib/model/translation_sessions/TranslationSession";
import { BaseController } from "./BaseController";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

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

        let org: Organization|undefined;
        try
        {
            org = await new Organization({ id: orgId }).getSingle(connection()) as Organization;
        }
        catch (err)
        {
            this._messages.push(String(err));
        }
        this.pageData.orgObj = org;

    }

    public async viewprofile()
    {
        this._pageTitle = "Signum | Ver perfil de organização";
        this._pageSubtitle = "Ver perfil de organização";

        const [ orgId, orgName ] = await Organization.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.organizationName = orgName;

        let org: Organization|undefined;
        try
        {
            org = await new Organization({ id: orgId }).getSingle(connection()) as Organization;
        }
        catch (err)
        {
            this._messages.push(String(err));
        }

        this.pageData.orgObj = org;
    }

    public async recoverpassword()
    {
        this._pageTitle = "Signum | Recuperar senha de organização";
        this._pageSubtitle = "Recuperar senha de organização";

        const otpOrgId = Number(this.request.query.otp_organization_id ?? 0);
        const otpInCookie = this.request.cookies.organizationRecPasswordOtp ?? undefined;
        const orgIdInCookie = this.request.cookies.organizationRecPasswordId ?? undefined;
        this.pageData.mode = otpOrgId ? 'askOtp' : (otpInCookie && orgIdInCookie ? 'changePassword' : 'askEmail');
        this.pageData.organizationId = otpOrgId || orgIdInCookie;
    }

    public async distributeminutes()
    {
        this._pageTitle = "Signum | Distribuir minutos";
        this._pageSubtitle = "Distribuir minutos";

        const [ orgId, orgName ] = await Organization.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.organizationName = orgName;

        const preselCustomerId = this.request.query.cust_id ? Number(this.request.query.cust_id) : null;

        let org: Organization|undefined;
        let custs: Customer[]|undefined;
        try
        {
            org = await new Organization({ id: orgId }).getSingle(connection()) as Organization;
            custs = await new Customer({ organization_id: orgId }).getMultipleFromOrganization(connection(), '', 'name');            
        }
        catch (err)
        {
            this._messages.push(String(err));
        }

        this.pageData.orgObj = org;
        this.pageData.allCustomers = custs;
        this.pageData.preselCustomerId = preselCustomerId;
    }

    public async seizeminutes()
    {
        this._pageTitle = "Signum | Confiscar minutos";
        this._pageSubtitle = "Confiscar minutos";

        const [ orgId, orgName ] = await Organization.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.organizationName = orgName;

        const preselCustomerId = this.request.query.cust_id ? Number(this.request.query.cust_id) : null;

        let org: Organization|undefined;
        let custs: Customer[]|undefined;
        try
        {
            org = await new Organization({ id: orgId }).getSingle(connection()) as Organization;
            custs = await new Customer({ organization_id: orgId }).getMultipleFromOrganization(connection(), '', 'name');
        }
        catch (err)
        {
            this._messages.push(String(err));
        }

        this.pageData.orgObj = org;
        this.pageData.allCustomers = custs;
        this.pageData.preselCustomerId = preselCustomerId;
    }

    public async reportsessions()
    {
        this._pageTitle = "Signum | Relatório de atendimentos";
        this._pageSubtitle = "Relatório de atendimentos";

        const [ orgId, orgName ] = await Organization.checkLoginOnPage(connection(), this.request, this.response);
        this.pageData.organizationName = orgName;

        const custId = this.request.query?.customer_id ? Number(this.request.query?.customer_id) : undefined;
        const itemsOnpage = 20;
        const getter = new TranslationSession();
        const sessionsCount = await getter.getCountFromOrganization(connection(), orgId, custId);
        const sessions = await getter.getMultipleFromOrganization(connection(), orgId, custId, String(this.request.query.order_by ?? ''), Number.parseInt(String(this.request.query.page_num ?? 1)), itemsOnpage);  
    
        await Promise.all(sessions.map(s => s.fetchCustomer(connection())));

        const transformed = transformDataRows(sessions, 
        {
            'ID': c => c.get("id"),
            'Início': c => c.get("begin") ? new Date(c.get("begin")!).toLocaleString() : "***",
            'Fim': c => c.get("begin") ? new Date(c.get("end")!).toLocaleString() : "***",
            'Duração': c =>
            {
                const begin = dayjs(c.get("begin"), undefined, "pt-br");
                const end = dayjs(c.get("end"), undefined, "pt-br");

                return end.diff(begin, "minutes") + " min";
            },
            'Cliente': c => `${c.customer?.get("name")} (${c.customer?.get("username")}) ID: ${c.get("customer_id")}`,
            'Visitantes': c => c.get("guests") ?? 0,
            'Nota de avaliação': c => (c.get("evaluation_points") ?? '***') + " / 10"
        });

        this.pageData.sessionsData = transformed;
        this.pageData.sessionsCount = sessionsCount;
        this.pageData.itemsOnpage = itemsOnpage;
    
    }
}