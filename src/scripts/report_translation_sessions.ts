import { Request, Response, Router, NextFunction, json } from "express";
import { TranslationSession } from "../lib/model/translation_sessions/TranslationSession";
import connection from "../lib/model/database/connection";
import { Organization } from "../lib/model/organizations/Organization";
import * as csv from 'fast-csv'; 
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

export function report_translation_sessions(request: Request, response: Response, next: NextFunction)
{
    const router = Router();
    router.get('/', async (req, res) =>
    {
        try
        {
            const custId = req.query?.customer_id ? Number(req.query?.customer_id) : undefined;
            const orgId = await Organization.checkLoginOnScript(request, response);
            const getter = new TranslationSession();
            const data = await getter.getMultipleFromOrganization(connection(), orgId, custId, String(request.query.order_by ?? "")); 
            await Promise.all(data.map(s => s.fetchCustomer(connection())));

            res.header("content-type", "text/csv")
            res.header('content-disposition', `attachment; filename="sessões-de-atendimento.csv"`);
            const csvStream = csv.format({ headers: true, delimiter: ";", writeBOM: true });
            csvStream.pipe(res);

            for (const row of data)
                csvStream.write(
            { 
                'ID': row.get("id") ?? 0,
                'Início': row.get("begin") ? new Date(row.get("begin")!).toLocaleString() : "***",
                'Fim': row.get("begin") ? new Date(row.get("end")!).toLocaleString() : "***",
                'Duração': (c =>
                {
                    const begin = dayjs(c.get("begin"), undefined, "pt-br");
                    const end = dayjs(c.get("end"), undefined, "pt-br");
    
                    return end.diff(begin, "minutes") + " min";
                })(row),
                'Cliente': `${row.customer?.get("name")} (${row.customer?.get("username")}) ID: ${row.get("customer_id")}`,
                'Visitantes': row.get("guests") ?? 0,
                'Nota de avaliação': (row.get("evaluation_points") ?? '***') + " / 10"
            });

            csvStream.end();
        }
        catch (err)
        {
            res.status(500).send("Erro ao exportar!");
        }
    });
    
    router(request, response, next);
}