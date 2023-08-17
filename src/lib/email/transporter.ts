import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

declare global 
{
    var nodemailer: nodemailer.Transporter<SMTPTransport.SentMessageInfo>|undefined;
}

const registerTransporter = (initFn: () => nodemailer.Transporter<SMTPTransport.SentMessageInfo>) => 
{
    if (process.env.NODE_ENV === 'development') 
    {
        if (!global.nodemailer)
            global.nodemailer = initFn();

        return global.nodemailer;
    }
    return initFn();
};

export let current: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

export function create(): nodemailer.Transporter<SMTPTransport.SentMessageInfo>
{
    let transp = nodemailer.createTransport(
        {
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: false,
            auth:
            {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            },
            tls:{
                ciphers:'SSLv3'
            }
        });
    console.log("New e-mail transporter!");
    return transp;
}

export const fromEmail = () : string =>  process.env.EMAIL_SENDER ?? '';
export const replyToEmail = () : string => process.env.EMAIL_REPLY_TO ?? '';

export default function get(): nodemailer.Transporter<SMTPTransport.SentMessageInfo>
{
    if (!current)
        current = registerTransporter(create);

    return current;
}