import { BaseController } from "./BaseController.js";
import { get } from "../lib/helpers/statisticsManager.js";
import { Request, Response } from "express";

export class homepage extends BaseController
{
    protected static readonly controllerName: string = 'homepage';

    public home()
    {
        this._pageTitle = "Signum Platform";
        this._pageSubtitle = "Bem vindo à Singum Platform!";

        const { sessionList, intrWaitingList, custWaitingList } = get();

        this.pageData.sessionCount = sessionList;
        this.pageData.intrWaitingCount = intrWaitingList;
        this.pageData.custWaitingCount = custWaitingList;
    }
}