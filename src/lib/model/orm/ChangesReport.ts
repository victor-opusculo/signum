import { Knex } from "knex";
import { DataEntity, KeysOf, TypeOfDataProperty } from "./DataEntity";
import { PropertiesGroup } from "./DataProperty";

export interface Report
{
    create: { [key:string] : any }[],
    update: { [key:string] : any }[],
    delete: { [key:string] : any }[]
}

function isReport(object: any) : object is Report
{
    return 'create' in object && Array.isArray(object.create) &&
    'update' in object && Array.isArray(object.update) &&
    'delete' in object && Array.isArray(object.delete)
}

type Constructor<T> = new (...args: any[]) => T;
type PickMatching<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
type ExtractMethods<T> = keyof PickMatching<T, Function>;

export class ChangesReport<T extends DataEntity<Props>, Props extends PropertiesGroup>
{
    private report: Report;

    private insertEntities: T[] = [];
    private updateEntities: T[] = [];
    private deleteEntities: T[] = [];

    public constructor(json: string|object, constructorFn: Constructor<T>)
    {
        if (typeof json === "string")
            this.report = JSON.parse(json);
        else if (typeof json === "object" && isReport(json))
            this.report = json;
        else
            throw new Error("Erro ao criar instância de ChangesReport. Parâmetro JSON inválido.");

        this.buildEntitiesObjects(constructorFn);
    }

    public buildEntitiesObjects(construct: Constructor<T>)
    {
        this.deleteEntities = this.report.delete.map( deleteReg => new construct({...deleteReg, fromProps: deleteReg}) );
        this.updateEntities = this.report.update.map( updateReg => new construct({...updateReg, fromProps: updateReg}) );
        this.insertEntities = this.report.create.map( createReg => new construct(createReg) );
    }

    public async applyToDatabase(conn: Knex) : Promise<number>
    {
        let affectedRows = 0;
        for (const delEntity of this.deleteEntities)
        {
            const ent = await delEntity.getSingle(conn);
            if (ent)
            {
                ent.fillPropertiesFromDataRow(delEntity.otherProperties.fromProps);
                affectedRows += (await ent.del(conn)).affectedRows;
            }
        }

        for (const updEntity of this.updateEntities)
        {
            const ent = await updEntity.getSingle(conn);
            if (ent)
            {
                ent.fillPropertiesFromDataRow(updEntity.otherProperties.fromProps);
                affectedRows += (await ent.save(conn)).affectedRows;
            }
        }

        for (const insEntity of this.insertEntities)
            affectedRows += (await insEntity.save(conn)).affectedRows;

        return affectedRows;
    }

    public setPropertyValueForAll<P extends KeysOf<Props>>(propName: P, value: TypeOfDataProperty<Props[P]>|null) : void
    {
        for (const delEntity of this.deleteEntities)
            delEntity.set(propName, value);

        for (const updEntity of this.updateEntities)
            updEntity.set(propName, value);

        for (const insEntity of this.insertEntities)
            insEntity.set(propName, value);
    }

    public callMethodForAll(methodName: ExtractMethods<T>, ...values: any[]) : void
    {
        for (const delEntity of this.deleteEntities)
            if (methodName in delEntity && typeof delEntity[methodName] === "function")
                (delEntity[methodName] as Function).apply(delEntity, values);

        for (const updEntity of this.updateEntities)
            if (methodName in updEntity && typeof updEntity[methodName] === "function")
                (updEntity[methodName] as Function).apply(updEntity, values);

        for (const insEntity of this.insertEntities)
            if (methodName in insEntity && typeof insEntity[methodName] === "function")
                (insEntity[methodName] as Function).apply(insEntity, values);
    }
}