import { Knex } from "knex";
import { DataEntity, DataProperty, DataRow, EntityAttributes, PropertiesGroup } from "../orm";
import { Organization } from "../organizations/Organization";
import { Customer } from "../customers/Customer";

export interface TranslationSessionProperties extends PropertiesGroup
{
    id: DataProperty<number>;
    begin: DataProperty<Date>;
    end: DataProperty<Date>;
    interpreter_id: DataProperty<number>;
    customer_id: DataProperty<number>;
    evaluation_points: DataProperty<number>;
    guests: DataProperty<number>;
}

type TranslationSessionAttributes = EntityAttributes<TranslationSessionProperties>;

export class TranslationSession extends DataEntity<TranslationSessionProperties>
{
    public constructor(initialValues?: DataRow)
    {
        super(
        {
            id: new DataProperty(),
            begin: new DataProperty(),
            end: new DataProperty(),
            interpreter_id: new DataProperty(),
            customer_id: new DataProperty(),
            evaluation_points: new DataProperty(),
            guests: new DataProperty()
        }, initialValues);
    }

    #customer: Customer|undefined;

    public get customer() { return this.#customer; }

    public static readonly databaseTable: string = 'translation_sessions';
    public static readonly primaryKeys: string[] = ['id'];

    public async getCountFromOrganization(conn: Knex, organizationId: number, customerId?: number) : Promise<number>
    {
        const self = this.constructor as typeof TranslationSession;
        const qb = conn<TranslationSessionAttributes>(self.databaseTable)
            .innerJoin(Customer.databaseTable, `${Customer.databaseTable}.id`, "=", `${self.databaseTable}.customer_id`)
            .innerJoin(Organization.databaseTable, `${Organization.databaseTable}.id`, "=", `${Customer.databaseTable}.organization_id`)
            .where(`${Organization.databaseTable}.id`, "=", organizationId)
            .count(`${self.databaseTable}.id`, { as: "count" })
            .first();

            if (customerId)
                qb.where(`${Customer.databaseTable}.id`, "=", customerId);

            const drs = await qb;
            
            if (drs && drs.count)
                return Number(drs.count)
            else
                return 0;
    } 

    public async getMultipleFromOrganization(conn: Knex, organizationId: number, customerId?: number, orderBy?: string, page?: number, numResultsOnPage?: number) : Promise<TranslationSession[]>
    {
        const self = this.constructor as typeof TranslationSession;
        const qb = conn<TranslationSessionAttributes>(self.databaseTable)
            .select(this.convertPropGroupToObjectWithValues([], conn, "select"))
            .innerJoin(Customer.databaseTable, `${Customer.databaseTable}.id`, "=", `${self.databaseTable}.customer_id`)
            .innerJoin(Organization.databaseTable, `${Organization.databaseTable}.id`, "=", `${Customer.databaseTable}.organization_id`)
            .where(`${Organization.databaseTable}.id`, "=", organizationId);

            if (customerId)
                qb.where(`${Customer.databaseTable}.id`, "=", customerId);

            switch (orderBy)
            {
                case "begin": qb.orderBy(`${self.databaseTable}.begin`, "desc"); break;
                case "end": qb.orderBy(`${self.databaseTable}.end`, "desc"); break;
                case "evaluation_points": qb.orderBy(`${self.databaseTable}.evaluation_points`, "desc"); break;
                case "id": default: qb.orderBy(`${self.databaseTable}.id`, "desc"); break;
            }

            if (page && numResultsOnPage)
            {
                const calcPage = (page - 1) * numResultsOnPage;
                qb
                .limit(numResultsOnPage)
                .offset(calcPage);
            }

            const drs = await qb;
            return drs.map(d => this.newInstanceFromDataRow(d) as TranslationSession);
    }

    public async fetchCustomer(conn: Knex) : Promise<this>
    {
        this.#customer = await new Customer({ id: this.get("customer_id") }).getSingle(conn) as Customer;
        return this;
    }
}