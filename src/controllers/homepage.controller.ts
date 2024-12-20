import { BaseController } from "./BaseController.js";
import { get } from "../lib/helpers/statisticsManager.js";
import { Request, Response } from "express";

export class homepage extends BaseController
{
    protected static readonly controllerName: string = 'homepage';

    public home()
    {
        this._pageTitle = "Central de Libras";
        this._pageSubtitle = "Bem-vindo(a) à Central de Libras!";

        const { sessionList, intrWaitingList, custWaitingList } = get();

        this.pageData.sessionCount = sessionList;
        this.pageData.intrWaitingCount = intrWaitingList;
        this.pageData.custWaitingCount = custWaitingList;
    }
}