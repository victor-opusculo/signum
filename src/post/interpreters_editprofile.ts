import { Request, Response, Router, NextFunction, urlencoded } from "express";
import { Interpreter } from "../lib/model/interpreters/Interpreter";
import multer from 'multer';
import connection from "../lib/model/database/connection";
import * as fs from 'fs/promises';
import { existsSync } from "fs";
import { InvalidFormInput } from "../lib/model/exceptions/InvalidFormInput";
import { fileFilterImages } from "../lib/helpers/FileFilterImages";
import { getStorage } from "../lib/helpers/FileDiskStorage";

const destinationUploadDir = './public/uploads/interpreters/';

export function interpreters_editprofile(request: Request, response: Response, next: NextFunction)
{
    const upload = multer({ storage: getStorage(destinationUploadDir), fileFilter: fileFilterImages });

    const router = Router();
    router.post('/', upload.single('fileIntrPhoto'), async (req, res) =>
    {
        const messages: string[] = [];
        try
        {
            const intrId = await Interpreter.checkLoginOnScript(req, res);
            const data = {...req.body};
            const file = req.file;

            delete data.intrId;
            delete data.intrMainId;

            let intr = new Interpreter({ id: intrId, username: data.intrUsername });
            if (await intr.existsUsername(connection()))
                throw new Error("Nome de usuário já existente!");

            intr = await new Interpreter({ id: intrId }).getSingle(connection()) as Interpreter;
            intr.fillPropertiesFromFormInput(data);
            
            if (data.txtOldPassword && data.txtNewPassword)
            {
                if (!await intr.checkPassword(data.txtOldPassword))
                    throw new InvalidFormInput("Senha antiga incorreta!");

                await intr.changePassword(data.txtNewPassword);
            }

            if (data.chkRemovePhoto)
            {
                if (existsSync(destinationUploadDir + '/' + intr.get("photo_filename")))
                    await fs.unlink(destinationUploadDir + '/' + intr.get("photo_filename"));

                intr.set("photo_filename", null);
            }

            if (file)
            {
                if (existsSync(destinationUploadDir + '/' + intr.get("photo_filename")))
                    await fs.unlink(destinationUploadDir + '/' + intr.get("photo_filename"));

                intr.set("photo_filename", file.filename);
            }

            const result = await intr.save(connection());
            if (result.affectedRows > 0 || file)
                messages.push("Dados alterados com sucesso!");
            else
                messages.push("Nenhum dado alterado.");
        }
        catch (err)
        {
            messages.push(String(err));
        }

        return res.status(303).redirect('/page/interpreters/editprofile?messages=' + messages.join('//'));
    });
    
    router(request, response, next);
}