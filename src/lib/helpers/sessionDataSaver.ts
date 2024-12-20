import { WriteStream } from 'node:fs';
import { Customer } from '../model/customers/Customer';
import connection from '../model/database/connection';
import { TranslationSession } from '../model/translation_sessions/TranslationSession';
import dayjs from 'dayjs';

export type SessionData = 
{
    id: string,
    interpreterId: ({ peerId: string, signumId: number })[],
    interpretersHistory: ({ peerId: string, signumId: number })[],
    customerId: { peerId: string|null, signumId: number }|null,
    guests: string[],
    beginTime: Date|undefined,
    endTime?: Date|undefined,
    createdByGuest: boolean,
    recordFileStream?: WriteStream,
    chatHistory: { sender: string, message: string, datetime: string }[]
};

export async function saveTranslationSessionData(data: SessionData)
{
    if (data.interpretersHistory.length < 1 || !data.customerId || !data.beginTime) return; // Ignore sessions without interpreters or clients

    const session = new TranslationSession();

    const lastIntr = data.interpretersHistory[data.interpretersHistory.length - 1]; 
    session.set('interpreter_id', lastIntr.signumId);
    session.set('customer_id', data.customerId.signumId);
    session.set('begin', data.beginTime);
    session.set('end', data.endTime ?? new Date());
    session.set('guests', data.guests.length);
    session.set('evaluation_points', null);
    session.set('room_uuid', data.id);
    session.encodeChatHistory(data.chatHistory);

    const result = await session.save(connection());

    const begin = dayjs(data.beginTime);
    const end = dayjs(data.endTime ?? new Date());
    const diffMinutes = end.diff(begin, "minutes");
    
    await Customer.debtSessionMinutes(connection(), data.customerId.signumId, diffMinutes);

    return result.newId ?? null;
}