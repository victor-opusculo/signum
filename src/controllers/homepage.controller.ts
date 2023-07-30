import { BaseController } from "./BaseController.js";
import { Request, Response } from "express";

export class homepage extends BaseController
{
    protected static readonly controllerName: string = 'homepage';

    public home()
    {
        this.pageData.testData = 123;
    }
}