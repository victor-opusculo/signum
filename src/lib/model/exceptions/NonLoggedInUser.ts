
export class NonLoggedInUser extends Error
{
    public constructor(message?: string, redirectTo?: string)
    {
        super(message ?? "Usuário não logado!");
        this.redirectTo = redirectTo;
    }

    public redirectTo: string|undefined;
}