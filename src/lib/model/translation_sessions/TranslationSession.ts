import { DataEntity, DataProperty, DataRow, PropertiesGroup } from "../orm";

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

    public static readonly databaseTable: string = 'translation_sessions';
    public static readonly primaryKeys: string[] = ['id'];
}