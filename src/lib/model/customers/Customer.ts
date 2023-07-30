import { DataEntity, DataProperty, DataRow, PropertiesGroup } from "../orm";

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
    last_login_token: DataProperty<string>;
}

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
    }
}