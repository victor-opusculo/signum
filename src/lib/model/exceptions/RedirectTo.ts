
export class RedirectTo extends Error
{
    public constructor(redirectTo: string)
    {
        super("Redirecionamento");
        this.redirectTo = redirectTo;
    }

    public redirectTo: string;
}