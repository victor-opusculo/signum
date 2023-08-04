import { Knex } from "knex";
import { DatabaseEntityNotFound } from "../exceptions/DatabaseEntityNotFound";
import { DataEntity, DataProperty, DataRow, EntityAttributes, PropertiesGroup } from "../orm";
import { Request, Response } from "express";
import { NonLoggedInUser } from "../exceptions/NonLoggedInUser";
import jwt from 'jwt-promisify';
import { InvalidToken } from "../exceptions/InvalidToken";
import bcrypt from 'bcrypt';
import { BlacklistedToken } from "../exceptions/BlacklistedToken";
import { CustomerInactive } from "../exceptions/CustomerInactive";

export interface CustomerProperties extends PropertiesGroup
{
    id: DataProperty<number>;
    name: DataProperty<string>;
    organization_id: DataProperty<number>;
    minutes_available: DataProperty<number>;
    username: DataProperty<string>;
    password_hash: DataProperty<string>;
    is_active: DataProperty<number>;
    registration_datetime: DataProperty<Date>;
    last_login_token: DataProperty<string|null>;
}

type CustomerAttributes = EntityAttributes<CustomerProperties>;

export class Customer extends DataEntity<CustomerProperties>
{
    public constructor(intitialValues?: DataRow)
    {
        super(
        {
            id: new DataProperty({ formFieldName: 'custId' }),
            name: new DataProperty({ formFieldName: 'custName' }),
            organization_id: new DataProperty({ formFieldName: 'custOrganizationId' }),
            minutes_available: new DataProperty({ formFieldName: 'custMinutes' }),
            username: new DataProperty({ formFieldName: 'custUsername' }),
            password_hash: new DataProperty({ formFieldName: 'custPasswordHash' }),
            is_active: new DataProperty({ formFieldName: 'custIsActive' }),
            registration_datetime: new DataProperty(),
            last_login_token: new DataProperty()
        }, intitialValues);

        this.properties.is_active.valueTransformer = value => this.otherProperties.chkIsActive ? 1 : 0;
    }

    public static readonly databaseTable: string = 'customers';
    public static readonly primaryKeys: string[] = ['id'];

    public hasMinutesAvailable() : boolean
    {
        return (this.get("minutes_available") ?? 0) > 0;
    }

    public async existsUsername(conn: Knex)
    {
        const count = await conn(Customer.databaseTable)
        .where({ username: this.get("username") ?? undefined })
        .andWhereNot({ id: this.get("id") ?? 0 })
        .count("id", { as: 'count' });

        const dr = count.pop();
        return (dr && dr.count && Number(dr.count) > 0);
    }

    public async getSingleFromOrganization(conn: Knex) : Promise<Customer>
    {
        const gotten = await conn<CustomerAttributes>(Customer.databaseTable)
        .where({ id: this.get("id") ?? undefined, organization_id: this.get("organization_id") ?? undefined })
        .select("*")
        .first();
        
        if (!gotten)
            throw new DatabaseEntityNotFound("Cliente não localizado!", Customer.databaseTable);
        
        return this.newInstanceFromDataRow(gotten) as Customer;
    }

    public static async checkLoginOnPage(conn: Knex, request: Request, response: Response) : Promise<[number, string, number|null]>
    {
        const token = request.cookies.customerToken ?? undefined;
        
        try
        {
            if (!token) throw new NonLoggedInUser("Cliente não logado!"); 

            const result = await jwt.verify(token, process.env.SIGNUM_CUSTOMERS_JWT_SECRET as string);
            
            if (await Customer.checkForBlacklistedTokens(conn, result.customerId, token))
                throw new BlacklistedToken();

            const cust = await conn<CustomerAttributes>(Customer.databaseTable)
            .where({ id: result.customerId ?? undefined })
            .select("id", "name", "username", "minutes_available")
            .first();
            
            return [ cust?.id ?? 0, cust?.name ?? '***', cust?.minutes_available ?? null ];
        }
        catch (err)
        {
            throw new NonLoggedInUser("Cliente não logado!", "/page/customers/login");
        }
    }

    public static async checkLoginOnScript(conn: Knex, request: Request, response: Response) : Promise<number>
    {
        const token = request.cookies.customerToken ?? undefined;
        if (!token) throw new NonLoggedInUser("Cliente não logado!"); 

        try
        {
            const result = await jwt.verify(token, process.env.SIGNUM_CUSTOMERS_JWT_SECRET as string);

            if (await Customer.checkForBlacklistedTokens(conn, result.customerId, token))
                throw new BlacklistedToken();

            return result.customerId ?? 0;
        }
        catch (err) { throw new InvalidToken(); }
    }

    public static async login(conn: Knex, username: string, password: string) : Promise<[boolean, number]>
    {
        const cust = await conn<CustomerAttributes>(Customer.databaseTable)
        .where({ username })
        .select('username', 'password_hash', 'id', 'is_active')
        .first();

        if (!cust)
            throw new DatabaseEntityNotFound("Cliente não localizado!", Customer.databaseTable);

        if (!cust.is_active)
            throw new CustomerInactive();

        if (await bcrypt.compare(password, cust.password_hash ?? ''))
            return [true, cust.id ?? 0];
        else
            return [false, cust.id ?? 0];
    }

    public static async registerAuthToken(conn: Knex, customerId: number, token: string)
    {
        const currentToken = await conn<CustomerAttributes>(Customer.databaseTable)
        .where({ id: customerId })
        .select("last_login_token")
        .first();

        if (currentToken && currentToken.last_login_token)
            conn('customers_blacklisted_tokens').insert({ customer_id: customerId, token: currentToken.last_login_token }).then(v => {});

        await conn<CustomerAttributes>(Customer.databaseTable)
        .where({ id: customerId })
        .update({ last_login_token: token });
    }

    public static async clearAuthToken(conn: Knex, request: Request)
    {
        const token = request.cookies.customerToken ?? undefined;

        if (token)
        {
            const result = await jwt.verify(token, process.env.SIGNUM_CUSTOMERS_JWT_SECRET as string);

            if (result)
                conn<CustomerAttributes>(Customer.databaseTable)
                .where({ id: result.customerId })
                .update({ last_login_token: null })
                .then(v => {});
        }
    }

    public static async checkForBlacklistedTokens(conn: Knex, customerId: number, token: string)
    {
        const count = await conn('customers_blacklisted_tokens')
        .where({ customer_id: customerId, token })
        .count("id", { as: "count" });

        const dr = count.pop();
        return Boolean(dr && dr.count && Number(dr.count) > 0);
    }

    public static async debtSessionMinutes(conn: Knex, customerId: number, minutesToSubtract: number)
    {
        const currentMinutes = await conn<CustomerAttributes>(Customer.databaseTable)
        .where({ id: customerId })
        .select("minutes_available")
        .first();

        if (currentMinutes !== undefined)
            await conn<CustomerAttributes>(Customer.databaseTable)
            .where({ id: customerId })
            .update({ minutes_available: Number(currentMinutes.minutes_available ?? 0) - minutesToSubtract }); 
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

    public async getOrganizationId(conn: Knex)
    {
        const result = await conn<CustomerAttributes>(Customer.databaseTable)
        .where({ id: this.get("id") ?? undefined })
        .select("organization_id")
        .first();

        return result?.organization_id;
    }

    public async getCountFromOrganization(conn: Knex, searchKeywords: string) : Promise<number>
    {
        let queryBuilder = conn(Customer.databaseTable).count('id', { as: 'count' })
        .where({ organization_id: this.get("organization_id") ?? undefined });

        if (searchKeywords.length > 3)
            queryBuilder.whereRaw("MATCH (name, username) AGAINST (?)", searchKeywords);

        let countDrs = await queryBuilder;
        let count = countDrs.pop()?.count;

        if (typeof count === "string")
            return Number.parseInt(count);
        else if (typeof count === "number")
            return count;
        else
            return 0;
    }

    public async getMultipleFromOrganization(conn: Knex, searchKeywords: string, orderBy: string, page?: number, numResultsOnPage?: number)
    {
        const queryBuilder = conn<CustomerAttributes>(Customer.databaseTable)
        .select(this.convertPropGroupToObjectWithValues([], conn, "select"))
        .where({ organization_id: this.get("organization_id") ?? undefined });

        if (searchKeywords.length > 3)
            queryBuilder.whereRaw("MATCH (name, username) AGAINST (?)", searchKeywords);

        switch (orderBy)
        {
            case "name": queryBuilder.orderBy("name", "asc"); break;
            case "username": queryBuilder.orderBy("username", "asc"); break;
            case "registration_datetime": default: queryBuilder.orderBy("registration_datetime", "desc"); break;
        }

        if (page && numResultsOnPage)
        {
	        const calcPage = (page - 1) * numResultsOnPage;
            queryBuilder.offset(calcPage);
            queryBuilder.limit(numResultsOnPage);
        }

        const rows = await queryBuilder as DataRow[];
        return rows.map( row => this.newInstanceFromDataRow(row) as Customer );
    }
}