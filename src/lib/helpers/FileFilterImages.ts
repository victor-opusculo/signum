import multer from 'multer';
import { Request } from 'express';
import { FileUploadError } from '../model/exceptions/FileUploadError';

export const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif'];

export function fileFilterImages(req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) 
{
    if (!acceptedTypes.includes(file.mimetype))
        callback(new FileUploadError("Tipo de arquivo não permitido!", file.originalname));

    if (file.size > 1024 * 1024 * 1)
        callback(new FileUploadError("Tamanho máximo de 1MB excedido!", file.originalname));

    callback(null, true);
}