import multer from "multer";
import path from "path";

export function getStorage(dest: string)
{
    return multer.diskStorage(
        {
            destination: dest,
            filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
        }
    );
}