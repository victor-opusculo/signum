import { Knex } from "knex";
import { DataEntity, DataProperty, DataRow, EntityAttributes, PropertiesGroup } from "../orm";
import { HelpdeskMessage } from "./HelpdeskMessage";

export interface HelpdeskCallProperties extends PropertiesGroup
{
    id: DataProperty<number>;
    customer_id: DataProperty<number>;
    title: DataProperty<string>;
    status: DataProperty<CallStatus>;
    created_at_dt: DataProperty<Date>;
}

export type CallStatus = "1_open"|"2_supportAnswered"|"3_customerAnswered"|"4_closed";
type HelpdeskCallAttributes = EntityAttributes<HelpdeskCallProperties>;

export class HelpdeskCall extends DataEntity<HelpdeskCallProperties>
{
    public constructor(initialValues?: DataRow)
    {
        super(
        {
            id: new DataProperty(),
            customer_id: new DataProperty(),
            title: new DataProperty({ formFieldName: 'hdcTitle' }),
            status: new DataProperty(),
            created_at_dt: new DataProperty({ defaultValue: new Date() })
        }, initialValues);
    }

    public static readonly databaseTable: string = 'helpdesk_calls';
    public static readonly primaryKeys: string[] = ['id'];

    public messages: HelpdeskMessage[] = [];

    public async getCountFromCustomer(conn: Knex, searchKeywords: string) : Promise<number>
    {
        let queryBuilder = conn(HelpdeskCall.databaseTable).count('id', { as: 'count' })
        .where({ customer_id: this.get("customer_id") ?? undefined });

        if (searchKeywords.length > 3)
            queryBuilder.whereRaw("MATCH (title) AGAINST (?)", searchKeywords);

        let countDrs = await queryBuilder;
        let count = countDrs.pop()?.count;

        if (typeof count === "string")
            return Number.parseInt(count);
        else if (typeof count === "number")
            return count;
        else
            return 0;
    }

    public async getMultipleFromCustomer(conn: Knex, searchKeywords: string, orderBy: string, page?: number, numResultsOnPage?: number)
    {
        const queryBuilder = conn<HelpdeskCallAttributes>(HelpdeskCall.databaseTable)
        .select(this.convertPropGroupToObjectWithValues([], conn, "select"))
        .where({ customer_id: this.get("customer_id") ?? undefined });

        if (searchKeywords.length > 3)
            queryBuilder.whereRaw("MATCH (title) AGAINST (?)", searchKeywords);

        switch (orderBy)
        {
            case "title": queryBuilder.orderBy("title", "asc"); break;
            case "status": queryBuilder.orderBy("status", "asc"); break;
            case "date": default: queryBuilder.orderBy("created_at_dt", "desc"); break;
        }

        if (page && numResultsOnPage)
        {
	        const calcPage = (page - 1) * numResultsOnPage;
            queryBuilder.offset(calcPage);
            queryBuilder.limit(numResultsOnPage);
        }

        const rows = await queryBuilder as DataRow[];
        return rows.map( row => this.newInstanceFromDataRow(row) as HelpdeskCall );
    }

    public translateStatus() : string
    {
        switch (this.properties.status.getValue())
        {
            case '1_open': return "Aberto";
            case '2_supportAnswered': return "Respondido pelo suporte";
            case '3_customerAnswered': return "Respondido pelo cliente";
            case '4_closed': return "Fechado";
            default: return 'Indefinido';
        }
    }

    public get isOpen() { return this.get("status") !== "4_closed"; }

    public async fetchMessages(conn: Knex) : Promise<void>
    {
        this.messages = await new HelpdeskMessage({ helpdesk_call_id: this.get("id") ?? 0 }).getAllFromCall(conn); 
    }
}