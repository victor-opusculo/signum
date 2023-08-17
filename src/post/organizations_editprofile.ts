import { Request, Response, Router, NextFunction, urlencoded } from "express";
import { Organization } from "../lib/model/organizations/Organization";
import multer from 'multer';
import connection from "../lib/model/database/connection";
import * as fs from 'fs/promises';
import { existsSync } from "fs";
import { InvalidFormInput } from "../lib/model/exceptions/InvalidFormInput";
import { fileFilterImages } from "../lib/helpers/FileFilterImages";
import { getStorage } from "../lib/helpers/FileDiskStorage";

const destinationUploadDir = './public/uploads/organizations/';

export function organizations_editprofile(request: Request, response: Response, next: NextFunction)
{
    const upload = multer({ storage: getStorage(destinationUploadDir), fileFilter: fileFilterImages });

    const router = Router();
    router.post('/', upload.single('fileOrgPhoto'), async (req, res) =>
    {
        const messages: string[] = [];
        try
        {
            const intrId = await Organization.checkLoginOnScript(req, res);
            const data = {...req.body};
            const file = req.file;

            delete data.orgId;
            delete data.orgPasswordHash;

            let org = new Organization({ id: intrId, username: data.intrUsername });
            if (await org.existsUsername(connection()))
                throw new Error("Nome de usuário já existente!");

            org = await new Organization({ id: intrId }).getSingle(connection()) as Organization;
            org.fillPropertiesFromFormInput(data);
            
            if (await org.existsEmailOnOther(connection()))
                throw new Error("E-mail já existente em outra organização!");

            if (data.txtOldPassword && data.txtNewPassword)
            {
                if (!await org.checkPassword(data.txtOldPassword))
                    throw new InvalidFormInput("Senha antiga incorreta!");

                await org.changePassword(data.txtNewPassword);
            }

            if (data.chkRemovePhoto)
            {
                if (existsSync(destinationUploadDir + '/' + org.get("logo_filename")))
                    await fs.unlink(destinationUploadDir + '/' + org.get("logo_filename"));

                org.set("logo_filename", null);
            }

            if (file)
            {
                if (existsSync(destinationUploadDir + '/' + org.get("logo_filename")))
                    await fs.unlink(destinationUploadDir + '/' + org.get("logo_filename"));

                org.set("logo_filename", file.filename);
            }

            const result = await org.save(connection());
            if (result.affectedRows > 0 || file)
                messages.push("Dados alterados com sucesso!");
            else
                messages.push("Nenhum dado alterado.");
        }
        catch (err)
        {
            messages.push(String(err));
        }

        return res.status(303).redirect('/page/organizations/editprofile?messages=' + messages.join('//'));
    });
    
    router(request, response, next);
}