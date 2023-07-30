import { DatabaseEntityNotFound } from "../exceptions/DatabaseEntityNotFound";
import { PropertiesGroup, OtherPropertiesGroup, DataProperty } from "./DataProperty"; 
import { Knex } from "knex";

export type DatabaseActionReturnInfos = { newId?: number, affectedRows: number };

export type DataRow = { [key:string]: any };

type RemoveIndex<T> = 
{
    [ K in keyof T as string extends K ? never : number extends K ? never : K ] : T[K]
};

export type KeysOf<T> = keyof RemoveIndex<T>;

export type TypeOfDataProperty<Dp> = Dp extends DataProperty<infer T> ? T : never; 

export type EntityAttributes<T extends PropertiesGroup> =
{
    [Property in keyof RemoveIndex<T>]+?: TypeOfDataProperty<T[Property]> extends PropertiesGroup ? EntityAttributes<TypeOfDataProperty<T[Property]>> : TypeOfDataProperty<T[Property]>;
};

type PlainProperties<P extends PropertiesGroup> = EntityAttributes<P> & DataRow;
export type Plain<T extends PropertiesGroup> =
{
    properties: PlainProperties<T>;
    other: DataRow;
};

export abstract class DataEntity<Props extends PropertiesGroup>
{

    public constructor(propertiesInitialization: Props, initialData: DataRow|undefined)
    {
        this.properties = propertiesInitialization;

        if (initialData)
            this.fillPropertiesFromDataRow(initialData);
    }

    protected cryptKey: string|undefined;
    protected filesFormData: FormData|undefined;

    public readonly properties: Props;
    public readonly otherProperties: OtherPropertiesGroup = {};

    public static readonly setPkValues: string[]= [];
    public static readonly primaryKeys: string[];
    public static readonly databaseTable: string;

    public get<P extends KeysOf<Props>>(propertyName: P) : TypeOfDataProperty<Props[P]>|null
    {
        return (this.properties[propertyName] as Props[P]).getValue() as TypeOfDataProperty<Props[P]>|null;
    }

    public set<P extends KeysOf<Props>>(propertyName: P, value: TypeOfDataProperty<Props[P]>|null) : void
    {
        this.properties[propertyName].setValue(value);
    }

    public setFilesFormData(formData: FormData)
    {
        this.filesFormData = formData;
    }

    public async getSingle(conn: Knex) : Promise<DataEntity<Props>|null>
    {
        const self = this.constructor as typeof DataEntity;

        const queryBuilder = conn(self.databaseTable);
        const row = await queryBuilder
        .where(this.convertPrimaryKeysToObjectWithValues(self.primaryKeys))
        .select(this.convertPropGroupToObjectWithValues([], conn, "select"))
        .first();

        if (row)
            return this.newInstanceFromDataRow(row);
        else
            throw new DatabaseEntityNotFound("Entidade não encontrada!", self.databaseTable);
    }

    public async getAll(conn: Knex) : Promise<DataEntity<Props>[]>
    {
        const self = this.constructor as typeof DataEntity;

        const rows = await conn(self.databaseTable).select(this.convertPropGroupToObjectWithValues([], conn, "select"));

        if (rows.length > 0)
            return rows.map( r => this.newInstanceFromDataRow(r) ).filter( e => e ? true : false) as DataEntity<Props>[];
        else
            return [];
    }

    public set encryptionKey(value: string|undefined)
    {
        this.cryptKey = value;
    }

    protected getColumnNameForWhereClause(column: string) : string
    {
        const self = this.constructor as typeof DataEntity;
        const isEncrypted = this.properties[column].descriptor.encrypt ?? false;

        if (isEncrypted)
            return `CONVERT(AES_DECRYPT(${self.databaseTable}.${column}, '${this.cryptKey}') USING 'utf8mb4')`;
        else
            return `${self.databaseTable}.${column}`;
    }

    protected convertPropGroupToObjectWithValues(except: string[], conn: Knex|undefined = undefined, action: "insert"|"update"|"select"|undefined) : object
    {
        const self = this.constructor as typeof DataEntity;
        const output: any = {};

        for (let prop in this.properties)
        {
            if (!except.includes(prop))
            {
                if ((action === "insert" || action === "update") && (!conn || !this.properties[prop].descriptor.encrypt))
                    output[prop] = this.properties[prop].getValueForDatabase();
                else if (conn && (action === "insert" || action === "update"))
                    output[prop] = conn.raw("AES_ENCRYPT(?, ?)", [this.properties[prop].getValueForDatabase(), this.cryptKey]);
                else if (conn && action === "select")
                {
                    if (this.cryptKey && this.properties[prop].descriptor.encrypt)
                        output[prop] = conn.raw("CAST(AES_DECRYPT(??, ?) AS CHAR)", [`${self.databaseTable}.${prop}`, this.cryptKey]);
                    else
                        output[prop] = `${self.databaseTable}.${prop}`;
                }
            }
        }

        return output;
    }

    protected convertPrimaryKeysToObjectWithValues(primaryKeys: string[]) : object
    {
        const self = this.constructor as typeof DataEntity;
        const output: any = {};

        for (let prop in this.properties)
        {
            if (primaryKeys.includes(prop))
                output[`${self.databaseTable}.${prop}`] = this.properties[prop].getValueForDatabase();
        }

        return output;
    }

    protected newInstanceFromDataRow(datarow: DataRow) : DataEntity<Props>|null
    {
        const ctor: new () => DataEntity<Props> = Object.getPrototypeOf(this).constructor;
        const newInstance = new ctor();
        newInstance.fillPropertiesFromDataRow(datarow);
        newInstance.encryptionKey = this.cryptKey;
        return newInstance;
    }

    public fillPropertiesFromDataRow(dataRow: DataRow) : void
    {
        for (let prop in dataRow)
        {
            if (this.properties[prop])
                this.properties[prop].setValue(dataRow[prop]);
            else
                this.otherProperties[prop] = dataRow[prop];
        }
    }

    public fillPropertiesFromFormInput(formInput: DataRow|FormData) : void
    {
        let data: DataRow = {};

        if (formInput instanceof FormData)
            formInput.forEach( (value, key) => data[key] = value );
        else
            data = formInput;

        let foundProps: string[] = [];
        for (const prop in this.properties)
            foundProps = [...foundProps, ...this.properties[prop].fillFromFormInput(data)];

        for (const field in data)
            if (!foundProps.includes(field))
                this.otherProperties[field] = data[field];
    }

    protected async beforeDatabaseInsert(conn: Knex) : Promise<number> { return 0; }
    protected async afterDatabaseInsert(conn: Knex, insertResult: DatabaseActionReturnInfos) : Promise<DatabaseActionReturnInfos> { return insertResult; }

    protected async beforeDatabaseUpdate(conn: Knex) : Promise<number> { return 0; }
    protected async afterDatabaseUpdate(conn: Knex, updateResult: DatabaseActionReturnInfos) : Promise<DatabaseActionReturnInfos> { return updateResult; }

    protected async beforeDatabaseDelete(conn: Knex) : Promise<number> { return 0; }
    protected async afterDatabaseDelete(conn: Knex, deleteResult: DatabaseActionReturnInfos) : Promise<DatabaseActionReturnInfos> { return deleteResult; }

    public toJSON() : object
    {
        return { properties: this.properties, other: this.otherProperties };
    }

    public async save(conn: Knex) : Promise<DatabaseActionReturnInfos>
    {
        const self = this.constructor as typeof DataEntity;

        let gotten: DataEntity<Props>|null = null;
        try
        {
            gotten = await this.getSingle(conn);
        }
        catch (err)
        {
            if (!(err instanceof DatabaseEntityNotFound))
                throw err;
        }

        if (gotten) //update
        {
            let updateResult: DatabaseActionReturnInfos = { affectedRows: 0 };
            updateResult.affectedRows += await this.beforeDatabaseUpdate(conn);
            const whereObj = this.convertPrimaryKeysToObjectWithValues(self.primaryKeys);
            const returned = await conn(self.databaseTable).where(whereObj).update(this.convertPropGroupToObjectWithValues([...self.primaryKeys, 'created_at' ], conn, "update"));
            updateResult.affectedRows += returned;

            updateResult = await this.afterDatabaseUpdate(conn, updateResult);
            
            return updateResult;
        }
        else //insert
        {
            let insertResult: DatabaseActionReturnInfos = { affectedRows: 0 };
            insertResult.affectedRows += await this.beforeDatabaseInsert(conn);

            const returnedId = await conn(self.databaseTable).insert(this.convertPropGroupToObjectWithValues([...self.primaryKeys.filter(pk => !self.setPkValues.includes(pk)), 'created_at', 'updated_at'], conn, "insert"));
            insertResult.affectedRows += returnedId.length;
            insertResult.newId = returnedId.pop();

            insertResult = await this.afterDatabaseInsert(conn, insertResult);

            return insertResult;
        }
    }

    public async del(conn: Knex) : Promise<DatabaseActionReturnInfos>
    {
        let self = this.constructor as typeof DataEntity;

        let deleteResult: DatabaseActionReturnInfos = { affectedRows: 0 };
        deleteResult.affectedRows += await this.beforeDatabaseDelete(conn);

        const deletedRows = await conn(self.databaseTable).where(this.convertPrimaryKeysToObjectWithValues(self.primaryKeys)).del();

        deleteResult.affectedRows += deletedRows;
        deleteResult = await this.afterDatabaseDelete(conn, deleteResult);

        return deleteResult;
    }

    public getPlain() : Plain<Props>
    {
        let output = { properties: {}, other: {} } as Plain<Props>;

        for (const prop in this.properties)
            output.properties[prop] = this.properties[prop].getPlain() as any;

        for (const oprop in this.otherProperties)
            output.other[oprop] = this.otherProperties[oprop];

        return output;
    }
}