import { DataRow, KeysOf, TypeOfDataProperty } from "./DataEntity";

export interface PropertiesGroup
{
    [key: string]: DataProperty<unknown>;
}

export interface OtherPropertiesGroup
{
    [key: string]: any;
}

export interface DataPropertyDescriptor<T> 
{
    formFieldName?: string|null;
    defaultValue?: T|null;
    encrypt?: boolean;
}

export class DataProperty<T>
{
    protected value: T|null;
    public readonly descriptor: DataPropertyDescriptor<T>;
    public valueTransformer: ((value: unknown) => unknown)|undefined;

    public constructor(descriptor?: DataPropertyDescriptor<T>)
    {
        this.descriptor = descriptor ?? { formFieldName: null, defaultValue: null, encrypt: false };
        this.value = null;
    }

    public toJSON() : any
    {
        if (this.value instanceof Date) return this.value.toISOString();

        return this.value ?? this.descriptor.defaultValue ?? null;
    }

    public getValueTransformed() : unknown
    {
        if (this.valueTransformer)
            return this.valueTransformer(this.value);
        else
            return this.value ?? this.descriptor.defaultValue ?? null;
    }

    public getValueForDatabase() : unknown
    {
        return this.getValueTransformed();
    }

    public resetValue() : void
    {
        this.setValue(this.descriptor.defaultValue ?? null);
    }

    public fillFromFormInput(formInput: DataRow|FormData) : string[]
    {
        let data: DataRow = {};

        if (formInput instanceof FormData)
            formInput.forEach( (value, key) => data[key] = value );
        else
            data = formInput;

        for (const field in data)
            if (field === this.descriptor.formFieldName)
            {
                this.setValue(data[field]);
                return [ field ];
            }

        return [];
    }

    public getValue() : T|null { return this.value; }
    public setValue(value: T|null) { this.value = value; }

    public getPlain() : bigint|object|Array<any>|number|string|boolean|null
    {
        if (this.value instanceof Date)
            return this.value.toISOString();

        if (this.value === null)
            return null;

        switch (typeof this.value)
        {
            case "bigint":
                return this.value as bigint; break;
            case "number":
                return this.value as number; break;
            case "string":
                return this.value as string; break;
            case "boolean":
                return this.value as boolean; break;
            default:
                return String(this.value);
        }
    }
}

export class DataObjectProperty<Props extends PropertiesGroup> extends DataProperty<Props>
{
    public constructor(propGroup: Props, options: any)
    {
        super({ encrypt: options.encrypt ?? false });
        this.value = propGroup;
    }

    public getValueForDatabase(): unknown 
    {
        return JSON.stringify(this.getValueTransformed());
    }

    public setValue(value: Props | null): void 
    {
        if (value instanceof Array || (typeof value !== "string" && typeof value !== "object"))
            throw new Error("Erro ao definir valor de objeto do tipo DataObjectProperty. Valor não é JSON nem objeto.");

        const obj = typeof value === "string" ? JSON.parse(value) : (typeof value === "object" ? value : null);    

        
        if (!obj)
            this.resetValue();
        else if (typeof obj === "object")
            for (const prop in obj)
                if (this.value && this.value[prop])
                {
                    this.value[prop].setValue(obj[prop]);
                }
    }

    public resetValue(): void 
    {
        for (const prop in this.value)
            this.value[prop].resetValue();
    }

    public fillFromFormInput(formInput: DataRow|FormData) : string[]
    {
        let data: DataRow = {};

        if (formInput instanceof FormData)
            formInput.forEach( (value, key) => data[key] = value );
        else
            data = formInput;

        let foundProps: string[] = [];

        for (const prop in this.value)
            foundProps = [ ...foundProps, ...this.value[prop].fillFromFormInput(data)];

        return foundProps;
    }

    public getPlain() : bigint|object|Array<any>|number|string|boolean|null
    {
        let output: any = {};

        for (const prop in this.value)
            output[prop] = this.value[prop].getPlain();

        return output;
    }

    public toJSON() : any
    {
        return this.getPlain();
    }
}