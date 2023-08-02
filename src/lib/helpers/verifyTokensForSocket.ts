import jwt from 'jwt-promisify';

export async function verifyTokens(userType: "interpreter"|"customer", signumId: number, token: string)
{
    try
    {
        if (userType === "interpreter")
            await jwt.verify(token, process.env.SIGNUM_INTERPRETERS_JWT_SECRET as string);
        else if (userType === "customer")
            await jwt.verify(token, process.env.SIGNUM_CUSTOMERS_JWT_SECRET as string);
        else
            return false;

        return true;
    }
    catch (err)
    {
        return false;
    }
}