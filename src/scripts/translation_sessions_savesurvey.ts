import { Request, Response, Router, NextFunction, json } from "express";
import { TranslationSession } from "../lib/model/translation_sessions/TranslationSession";
import connection from "../lib/model/database/connection";

export function translation_sessions_savesurvey(request: Request, response: Response, next: NextFunction)
{
    const router = Router();
    router.use(json());
    router.post('/', async (req, res) =>
    {
        try
        {
            const { data } = req.body;
            const sess = await new TranslationSession({ id: data.sessId }).getSingle(connection());

            if (!sess) return res.status(401).send("ID de sessão inválido.");
            
            sess.set("evaluation_points", data.points ?? null);
            await sess.save(connection());

            res.status(200).send("Avaliação salva com sucesso!");
        }
        catch (err)
        {
            res.status(500).send("Erro ao salvar avaliação!");
        }
    });
    
    router(request, response, next);
}