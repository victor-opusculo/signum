
export class DatabaseEntityNotFound extends Error
{
    public databaseTable: string; 
    public constructor(message: string, dbTable: string)
    {
        super(message);
        this.databaseTable = dbTable;
    }

    public toString() : string
    {
        return "Erro: " + this.message;
    }
}