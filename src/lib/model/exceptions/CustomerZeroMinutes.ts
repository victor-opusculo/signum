
export class CustomerZeroMinutes extends Error
{
    public constructor(message: string|undefined, currentMinutesQty: number, redirectTo: string = '/')
    {
        super(message ?? "Cliente sem saldo de minutos disponível!");
        this.currentMinutes = currentMinutesQty;
        this.redirectTo = redirectTo;
    }

    public currentMinutes: number;
    public redirectTo: string;
}