import { Request } from "express";

export default {
    escapeHtml: (unsafe: string) => 
    {
        return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },

    overwriteQuery: (request: Request, queryParam: string, value: string) =>
    {
        const queries = {...request.query};
        queries[queryParam] = value;
        return queries;
    },

    genUrl: (base: string, query: any) =>
    {
        const queries = Object.entries(query).reduce( (prev, keyVal) => (prev ? prev + '&' : '') + `${keyVal[0]}=${keyVal[1]}`, '');
        return base + '?' + queries;
    }
}