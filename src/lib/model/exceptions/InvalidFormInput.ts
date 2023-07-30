
export class InvalidFormInput extends Error
{
    public constructor(message: string)
    {
        super(message);
    }
}