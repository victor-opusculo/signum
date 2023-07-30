
export class InvalidToken extends Error
{
    public constructor(message?: string)
    {
        super(message ?? "Token inválido!");
    }
}