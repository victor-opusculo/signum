import { Knex } from "knex";
import { DataEntity, DataProperty, DataRow, EntityAttributes, PropertiesGroup } from "../orm";

export interface SessionScheduleProperties extends PropertiesGroup
{
    id: DataProperty<number>;
    scheduled_datetime: DataProperty<Date>;
    expected_end_datetime: DataProperty<Date>;
    interpreter_id: DataProperty<number|null>;
    customer_id: DataProperty<number>;
}

type SessionScheduleAttributes = EntityAttributes<SessionScheduleProperties>;

export class SessionSchedule extends DataEntity<SessionScheduleProperties>
{
    public constructor(initialValues?: DataRow)
    {
        super(
        {
            id: new DataProperty({ formFieldName: 'schId' }),
            scheduled_datetime: new DataProperty({ formFieldName: 'schDateTime' }),
            expected_end_datetime: new DataProperty({ formFieldName: 'schExpEndDateTime' }),
            interpreter_id: new DataProperty(),
            customer_id: new DataProperty()
        }, initialValues);
    }

    public static readonly databaseTable: string = 'session_schedules';
    public static readonly primaryKeys: string[] = ['id'];

    public async getNextFromCustomer(conn: Knex) : Promise<SessionSchedule[]>
    {
        const gotten = await conn<SessionScheduleAttributes>(SessionSchedule.databaseTable)
        .where({ customer_id: this.get("customer_id") ?? undefined })
        .whereRaw(`${SessionSchedule.databaseTable}.scheduled_datetime >= NOW()`);

        return gotten.map( dr => this.newInstanceFromDataRow(dr) as SessionSchedule );
    }

    public async getNextFromInterpreter(conn: Knex) : Promise<SessionSchedule[]>
    {
        const gotten = await conn<SessionScheduleAttributes>(SessionSchedule.databaseTable)
        .where({ interpreter_id: this.get("interpreter_id") ?? undefined })
        .whereRaw(`${SessionSchedule.databaseTable}.scheduled_datetime >= NOW()`);

        return gotten.map( dr => this.newInstanceFromDataRow(dr) as SessionSchedule );
    }

    public async getNextWithoutInterpreter(conn: Knex) : Promise<SessionSchedule[]>
    {
        const gotten = await conn<SessionScheduleAttributes>(SessionSchedule.databaseTable)
        .where({ interpreter_id: null })
        .whereRaw(`${SessionSchedule.databaseTable}.scheduled_datetime >= NOW()`);

        return gotten.map( dr => this.newInstanceFromDataRow(dr) as SessionSchedule );
    }
}