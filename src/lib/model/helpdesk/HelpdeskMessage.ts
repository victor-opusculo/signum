import { Knex } from "knex";
import { DataEntity, DataProperty, DataRow, EntityAttributes, PropertiesGroup } from "../orm";

export type MessageSenderType = "customer"|"support"

export interface HelpdeskMessageProperties extends PropertiesGroup
{
    id: DataProperty<number>;
    helpdesk_call_id: DataProperty<number>;
    message: DataProperty<string>;
    sender_name: DataProperty<string>;
    sender_type: DataProperty<MessageSenderType>;
    sent_at: DataProperty<Date>;
}

type HelpdeskMessageAttributes = EntityAttributes<HelpdeskMessageProperties>;

export class HelpdeskMessage extends DataEntity<HelpdeskMessageProperties>
{
    public constructor(initialValues?: DataRow)
    {
        super(
        {
            id: new DataProperty(),
            helpdesk_call_id: new DataProperty({ formFieldName: 'hdmCallId' }),
            message: new DataProperty({ formFieldName: 'hdmMessage' }),
            sender_name: new DataProperty(),
            sender_type: new DataProperty(),
            sent_at: new DataProperty({ defaultValue: new Date() })
        }, initialValues);
    }

    public static readonly databaseTable: string = 'helpdesk_messages';
    public static readonly primaryKeys: string[] = ['id'];

    public async getAllFromCall(conn: Knex) : Promise<HelpdeskMessage[]>
    {
        const gotten = await conn<HelpdeskMessageAttributes>(HelpdeskMessage.databaseTable)
        .where({ helpdesk_call_id: this.get("helpdesk_call_id") ?? 0 })
        .select("*")
        .orderBy("sent_at", "desc");

        return gotten.map( dr => this.newInstanceFromDataRow(dr) as HelpdeskMessage );
    }
}