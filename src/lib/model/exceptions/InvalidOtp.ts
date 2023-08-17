
export class InvalidOtp extends Error
{
    public constructor(message: string)
    {
        super(message);
    }

    public toString() : string
    {
        return "Erro: " + this.message;
    }
}