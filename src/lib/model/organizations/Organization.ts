import { Knex } from "knex";
import { DataEntity, DataProperty, DataRow, EntityAttributes, PropertiesGroup } from "../orm";
import { Request, Response } from "express";
import { NonLoggedInUser } from "../exceptions/NonLoggedInUser";
import jwt from 'jwt-promisify';
import { InvalidToken } from "../exceptions/InvalidToken";
import { DatabaseEntityNotFound } from "../exceptions/DatabaseEntityNotFound";
import bcrypt from 'bcrypt';
import { Customer } from "../customers/Customer";
import { fromEmail, replyToEmail } from "../../email/transporter";
import type Mail from 'nodemailer/lib/mailer';
import dayjs from "dayjs";
import { InvalidOtp } from "../exceptions/InvalidOtp";
import { OtpExpired } from "../exceptions/OtpExpired";

export interface OrganizationProperties extends PropertiesGroup
{
    id: DataProperty<number>;
    name: DataProperty<string>;
    email: DataProperty<string>;
    other_infos_json: DataProperty<string>;
    username: DataProperty<string>;
    password_hash: DataProperty<string>;
    logo_filename: DataProperty<string>;
    minutes_available: DataProperty<number>;
    recover_password_hash: DataProperty<string|null>;
    recover_password_expiry: DataProperty<Date|null>;
}

type OrganizationAttributes = EntityAttributes<OrganizationProperties>;

type OtherInfos = 
{
    label: string,
    value: string
}[];

export function recoverPasswordMessage(organization: Organization, passcode: string) : Mail.Options
{
    return {
        from: fromEmail(),
        to: String(organization.get("email")),
        subject: "Signum Platform | Seu código para recuperação de senha",
        text: `Olá, ${organization.get("name") ?? ""}! 
        Seu código de recuperação de senha de acesso ao painel é ${passcode}.`
    };
}

export class Organization extends DataEntity<OrganizationProperties>
{
    public constructor(initialValues?: DataRow)
    {
        super(
        {
            id: new DataProperty({ formFieldName: 'orgId' }),
            name: new DataProperty({ formFieldName: 'orgName' }),
            email: new DataProperty({ formFieldName: 'orgEmail' }),
            other_infos_json: new DataProperty({ formFieldName: 'orgOtherInfos' }),
            username: new DataProperty({ formFieldName: 'orgUsername' }),
            password_hash: new DataProperty({ formFieldName: 'orgPasswordHash' }),
            logo_filename: new DataProperty(),
            minutes_available: new DataProperty(),
            recover_password_hash: new DataProperty(),
            recover_password_expiry: new DataProperty()
        }, initialValues);
    }

    public static readonly databaseTable: string = 'organizations';
    public static readonly primaryKeys: string[] = ['id'];

    public async existsUsername(conn: Knex)
    {
        const count = await conn(Organization.databaseTable)
        .where({ username: this.get("username") ?? undefined })
        .andWhereNot({ id: this.get("id") ?? 0 })
        .count("id", { as: 'count' });

        const dr = count.pop();
        return (dr && dr.count && Number(dr.count) > 0);
    }

    public async existsEmailOnOther(conn: Knex)
    {
        const count = await conn(Organization.databaseTable)
        .where({ email: this.get("email") ?? '' })
        .whereNot({ id: this.get("id") ?? 0 })
        .count("id", { as: 'count' });

        const dr = count.pop();
        return Boolean(dr && dr.count && Number(dr.count) > 0);
    }

    public async existsEmail(conn: Knex)
    {
        const count = await conn(Organization.databaseTable)
        .where({ email: this.get("email") ?? '' })
        .count("id", { as: 'count' });

        const dr = count.pop();
        return Boolean(dr && dr.count && Number(dr.count) > 0);
    }

    public async getSingleByEmail(conn: Knex)
    {
        const gotten = await conn<OrganizationAttributes>(Organization.databaseTable)
        .where({ email: this.get('email') ?? '' })
        .select(this.convertPropGroupToObjectWithValues([], conn, "select"))
        .first();

        if (!gotten)
            throw new DatabaseEntityNotFound("Organização não localizada!", Organization.databaseTable);

        return this.newInstanceFromDataRow(gotten) as Organization;
    }

    public async createRecoverPasswordOtp()
    {
        const salt = await bcrypt.genSalt(10);
        const passcode = Math.floor((Math.random() * 89999999) + 10000000);
        const hash = await bcrypt.hash(passcode.toString(), salt);

        this.set("recover_password_hash", hash);
        this.set("recover_password_expiry", dayjs().add(15, 'minutes').toDate());

        return passcode;
    }

    public async checkRecoverPasswordOtp(givenOtp: string)
    {
        const expiry = this.get("recover_password_expiry");
        if (expiry && expiry > new Date())
        {
            const passes = await bcrypt.compare(givenOtp, this.get("recover_password_hash") ?? '');
            if (!passes)
                throw new InvalidOtp("Código inválido! Tente novamente.");
        }
        else
            throw new OtpExpired("Código expirado! Tente gerar um novo.", expiry ?? new Date());
    }

    public static async loadOrganizationDataByCustomerId(conn: Knex, request: Request, response: Response)
    {
        if (request.cookies.customerToken)
        {
            try
            {
                const result = await jwt.verify(request.cookies.customerToken, process.env.SIGNUM_CUSTOMERS_JWT_SECRET as string);
                const orgId = await new Customer({ id: result.customerId }).getOrganizationId(conn);
                const organization = await new Organization({ id: orgId }).getSingle(conn) as Organization;
                return organization;
            }
            catch (err) { return undefined; }
        }
        else if (request.query.related_customer_id)
        {
            try
            {
                const custId = Number(request.query.related_customer_id ?? 0);
                const orgId = await new Customer({ id: custId }).getOrganizationId(conn);
                const organization = await new Organization({ id: orgId }).getSingle(conn) as Organization;
                return organization;
            }
            catch (err) { return undefined; }
        }

        return undefined;
    }

    public static async checkLoginOnPage(conn: Knex, request: Request, response: Response) : Promise<[number, string]>
    {
        const token = request.cookies.organizationToken ?? undefined;
        
        try
        {
            if (!token) throw new NonLoggedInUser("Organização não logada!"); 

            const result = await jwt.verify(token, process.env.SIGNUM_ORGANIZATIONS_JWT_SECRET as string);
            
            const org = await conn<OrganizationAttributes>(Organization.databaseTable)
            .where({ id: result.organizationId ?? undefined })
            .select("id", "name", "username")
            .first();
            
            return [ org?.id ?? 0, org?.name ?? '***' ];
        }
        catch (err)
        {
            throw new NonLoggedInUser("Organização não logada!", "/page/organizations/login");
        }
    }

    public static async checkLoginOnScript(request: Request, response: Response) : Promise<number>
    {
        const token = request.cookies.organizationToken ?? undefined;
        if (!token) throw new NonLoggedInUser("Organização não logada!"); 

        try
        {
            const result = await jwt.verify(token, process.env.SIGNUM_ORGANIZATIONS_JWT_SECRET as string);
            return result.organizationId ?? 0;
        }
        catch (err) { throw new InvalidToken(); }
    }

    public static async login(conn: Knex, username: string, password: string) : Promise<[boolean, number]>
    {
        const org = await conn<OrganizationAttributes>(Organization.databaseTable)
        .where({ username })
        .select('username', 'password_hash', 'id')
        .first();

        if (!org)
            throw new DatabaseEntityNotFound("Organização não localizada!", Organization.databaseTable);

        if (await bcrypt.compare(password, org.password_hash ?? ''))
            return [true, org.id ?? 0];
        else
            return [false, org.id ?? 0];
    }

    public async checkPassword(givenPassword: string)
    {
        return await bcrypt.compare(givenPassword, this.get("password_hash") ?? '');
    }

    public async changePassword(newPassword: string)
    {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        this.set("password_hash", hash);
    }

    public decodeOtherInfos() : OtherInfos
    {
        return JSON.parse(this.get("other_infos_json") ?? '[]') as OtherInfos;
    }
}