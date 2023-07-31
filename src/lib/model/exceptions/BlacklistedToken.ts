export class BlacklistedToken extends Error
{
    public constructor(message?: string)
    {
        super(message ?? "Token de autenticação invalidado!");
    }

    public toString() : string
    {
        return "Erro: " + this.message;
    }
}