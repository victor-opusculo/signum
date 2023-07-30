
export class OtpExpired extends Error
{
    private expiredDate: Date;
    public constructor(message: string, expired: Date)
    {
        super(message);
        this.expiredDate = expired;
    }

    public get expiryDate() : Date { return this.expiredDate; }
}