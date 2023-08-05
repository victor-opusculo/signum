import { SessionData } from "./sessionDataSaver";

let sessionList: SessionData[] = [];
let intrList: string[] = [];
let custList: string[] = [];

export function register(roomsList: SessionData[], interpretersWaitingRoom: string[], customersWaitingRoom: string[])
{
    sessionList = roomsList;
    intrList = interpretersWaitingRoom;
    custList = customersWaitingRoom;
}

export function get()
{
    return { sessionList: sessionList.length, intrWaitingList: intrList.length, custWaitingList: custList.length };
}