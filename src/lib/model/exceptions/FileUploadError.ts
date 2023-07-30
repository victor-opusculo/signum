
export class FileUploadError extends Error
{
    public filename: string; 
    public constructor(message: string, filename: string)
    {
        super(message);
        this.filename = filename;
    }
}