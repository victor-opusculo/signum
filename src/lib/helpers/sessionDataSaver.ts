import { Customer } from '../model/customers/Customer';
import connection from '../model/database/connection';
import { TranslationSession } from '../model/translation_sessions/TranslationSession';
import dayjs from 'dayjs';

export type SessionData = 
{
    id: string,
    interpreterId: { peerId: string, signumId: number }|null,
    customerId: { peerId: string, signumId: number }|null,
    guests: string[],
    beginTime: Date|undefined,
    endTime?: Date|undefined
};

export async function saveTranslationSessionData(data: SessionData)
{
    if (!data.interpreterId || !data.customerId || !data.beginTime) return; // Ignore sessions without interpreters or clients

    const session = new TranslationSession();

    session.set('interpreter_id', data.interpreterId.signumId);
    session.set('customer_id', data.customerId.signumId);
    session.set('begin', data.beginTime);
    session.set('end', data.endTime ?? new Date());
    session.set('guests', data.guests.length);
    session.set('evaluation_points', null);

    await session.save(connection());

    const begin = dayjs(data.beginTime);
    const end = dayjs(data.endTime ?? new Date());
    const diffMinutes = end.diff(begin, "minutes");
    
    await Customer.debtSessionMinutes(connection(), data.customerId.signumId, diffMinutes);
}