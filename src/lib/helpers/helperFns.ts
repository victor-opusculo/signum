import { Request, urlencoded } from "express";
import querystring from 'node:querystring';

export default {
    escapeHtml: (unsafe: string) => 
    {
        if (typeof unsafe !== "string")
            return '';

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
        const queries = querystring.stringify(query);
        //Object.entries(query).reduce( (prev, keyVal) => (prev ? prev + '&' : '') + `${keyVal[0]}=${keyVal[1]}`, '');
        return base + '?' + queries;
    },

    truncateText: (text: string, maxLength: number) : string =>
    {
        if (text.length <= maxLength)
            return text;

        return text.substring(0, maxLength) + '...';
    }
}