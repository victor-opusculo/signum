import { Request, Response } from "express";
import ejs from 'ejs';
import helperFns from "../lib/helpers/helperFns";
import { Organization } from "../lib/model/organizations/Organization";

type Constructor<T> = new (...args: any[]) => T;
type PickMatching<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };
type ExtractMethods<T> = keyof PickMatching<T, () => void>;

const withoutParams = (fn: (...args: any) => any): fn is () => void =>
    fn.length === 0;

const isFunction = (fn: any): fn is () => void =>
    typeof fn === 'function';

export class BaseController
{
    public constructor (request: Request, response: Response)
    {
        this._messages = request.query.messages ? String(request.query.messages).split('//') : []; 
        this.request = request;
        this.response = response;
    }

    protected static readonly controllerName: string = '';

    protected _pageTitle: string = "Signum Platform";
    protected _pageSubtitle: string = "Signum Platform";
    protected _messages: string[] = [];
    protected _loadedOrganization: Organization|undefined;
    protected pageData: { [key:string] : any } = { helperFns };
    protected action: string = "";
    protected request: Request;
    protected response: Response;

    protected renderedHtml: string = "";

    public get pageTitle() { return this._pageTitle; }
    public get pageSubtitle() { return this._pageSubtitle; }
    public get pageMessages() { return this._messages; }

    public set loadedOrganization(val: Organization) { this._loadedOrganization = val; }

    public async runAction<T extends BaseController>(this: T, action: keyof T)
    {
        this.action = action.toString();

        const fn = this[action];
        if (isFunction(fn) && withoutParams(fn))
            await fn.bind(this)();
        
        const self = this.constructor as typeof BaseController;
        this.renderedHtml = await ejs.renderFile(`./src/views/${self.controllerName}.${this.action}.ejs`, {...this.pageData, request: this.request, loadedOrganization: this._loadedOrganization } );
    }

    public render()
    {
        return this.renderedHtml;
    }
}
