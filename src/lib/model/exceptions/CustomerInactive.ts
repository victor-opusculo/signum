export class CustomerInactive extends Error
{
    public constructor(message?: string)
    {
        super(message ?? "Cliente não ativo!");
    }

    public toString() : string
    {
        return "Erro: " + this.message;
    }
}