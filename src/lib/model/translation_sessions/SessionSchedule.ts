import { Knex } from "knex";
import { DataEntity, DataProperty, DataRow, EntityAttributes, PropertiesGroup } from "../orm";
import { DatabaseEntityNotFound } from "../exceptions/DatabaseEntityNotFound";

export interface SessionScheduleProperties extends PropertiesGroup
{
    id: DataProperty<number>;
    scheduled_datetime: DataProperty<Date>;
    expected_end_datetime: DataProperty<Date>;
    interpreter_id: DataProperty<number|null>;
    customer_id: DataProperty<number>;
    room_id: DataProperty<string>;
    description: DataProperty<string>;
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
            customer_id: new DataProperty(),
            room_id: new DataProperty(),
            description: new DataProperty({ formFieldName: "schDescription" })
        }, initialValues);
    }

    public static readonly databaseTable: string = 'session_schedules';
    public static readonly primaryKeys: string[] = ['id'];

    public async getNextFromCustomer(conn: Knex) : Promise<SessionSchedule[]>
    {
        const gotten = await conn<SessionScheduleAttributes>(SessionSchedule.databaseTable)
        .where({ customer_id: this.get("customer_id") ?? undefined })
        .whereRaw(`${SessionSchedule.databaseTable}.scheduled_datetime >= NOW()`)
        .select("*");

        return gotten.map( dr => this.newInstanceFromDataRow(dr) as SessionSchedule );
    }

    public async getNextFromInterpreter(conn: Knex) : Promise<SessionSchedule[]>
    {
        const gotten = await conn<SessionScheduleAttributes>(SessionSchedule.databaseTable)
        .where({ interpreter_id: this.get("interpreter_id") ?? undefined })
        .whereRaw(`${SessionSchedule.databaseTable}.scheduled_datetime >= NOW()`)
        .innerJoin('customers', 'customers.id', SessionSchedule.databaseTable + '.customer_id')
        .innerJoin('organizations', 'organizations.id', 'customers.organization_id')
        .select(this.convertPropGroupToObjectWithValues([], conn, "select"), { customerName: 'customers.name', organizationName: 'organizations.name' });

        return gotten.map( dr => this.newInstanceFromDataRow(dr) as SessionSchedule );
    }

    public async getNextWithoutInterpreter(conn: Knex) : Promise<SessionSchedule[]>
    {
        const gotten = await conn<SessionScheduleAttributes>(SessionSchedule.databaseTable)
        .where({ interpreter_id: null })
        .whereRaw(`${SessionSchedule.databaseTable}.scheduled_datetime >= NOW()`)
        .innerJoin('customers', 'customers.id', SessionSchedule.databaseTable + '.customer_id')
        .innerJoin('organizations', 'organizations.id', 'customers.organization_id')
        .select(this.convertPropGroupToObjectWithValues([], conn, "select"), { customerName: 'customers.name', organizationName: 'organizations.name' });

        return gotten.map( dr => this.newInstanceFromDataRow(dr) as SessionSchedule );
    }

    public async getSingleFromCustomer(conn: Knex) : Promise<SessionSchedule>
    {
        const gotten = await conn<SessionScheduleAttributes>(SessionSchedule.databaseTable)
        .where({ customer_id: this.get("customer_id") ?? 0 })
        .whereRaw('session_schedules.id = ?', this.get("id") ?? 0 )
        .leftJoin("interpreters", "interpreters.id", `${SessionSchedule.databaseTable}.interpreter_id`)
        .select(this.convertPropGroupToObjectWithValues([], conn, "select"), { interpreterName: "interpreters.name" })
        .first();

        if (!gotten)
            throw new DatabaseEntityNotFound("Agendamento não localizado!", SessionSchedule.databaseTable);

        return this.newInstanceFromDataRow(gotten) as SessionSchedule;
    }

    public async getSingle(conn: Knex) : Promise<SessionSchedule>
    {
        const gotten = await conn<SessionScheduleAttributes>(SessionSchedule.databaseTable)
        .whereRaw('session_schedules.id = ?', this.get("id") ?? 0 )
        .innerJoin('customers', 'customers.id', SessionSchedule.databaseTable + '.customer_id')
        .innerJoin('organizations', 'organizations.id', 'customers.organization_id')
        .select(this.convertPropGroupToObjectWithValues([], conn, "select"), { customerName: 'customers.name', organizationName: 'organizations.name' })
        .first();

        if (!gotten)
            throw new DatabaseEntityNotFound("Agendamento não localizado!", SessionSchedule.databaseTable);

        return this.newInstanceFromDataRow(gotten) as SessionSchedule;
    }
}