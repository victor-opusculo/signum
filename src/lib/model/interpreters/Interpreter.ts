import { DataEntity, DataProperty, DataRow, EntityAttributes, PropertiesGroup } from "../orm";
import { Request, Response } from "express";
import jwt from 'jwt-promisify';
import { NonLoggedInUser } from "../exceptions/NonLoggedInUser";
import { Knex } from "knex";
import bcrypt from 'bcrypt';
import { DatabaseEntityNotFound } from "../exceptions/DatabaseEntityNotFound";
import { InvalidToken } from "../exceptions/InvalidToken";

export interface InterpreterProperties extends PropertiesGroup
{
    id: DataProperty<number>;
    name: DataProperty<string>;
    description: DataProperty<string>;
    photo_filename: DataProperty<string>;
    signorum_main_intr_id: DataProperty<number>;
    username: DataProperty<string>;
    password_hash: DataProperty<string>;
}

type InterpreterAttributes = EntityAttributes<InterpreterProperties>;

export class Interpreter extends DataEntity<InterpreterProperties>
{
    public constructor(initialValues?: DataRow)
    {
        super(
        {
            id: new DataProperty({ formFieldName: 'intrId' }),
            name: new DataProperty({ formFieldName: 'intrName' }),
            description: new DataProperty({ formFieldName: 'intrDescription' }),
            photo_filename: new DataProperty(),
            signorum_main_intr_id: new DataProperty({ formFieldName: 'intrMainId' }),
            username: new DataProperty({ formFieldName: 'intrUsername' }),
            password_hash: new DataProperty({ formFieldName: 'intrPasswordHash' })
        }, initialValues);
    }

    public static readonly databaseTable: string = 'interpreters';
    public static readonly primaryKeys: string[] = ['id'];

    public async existsUsername(conn: Knex)
    {
        const count = await conn(Interpreter.databaseTable)
        .where({ username: this.get("username") ?? undefined })
        .andWhereNot({ id: this.get("id") ?? 0 })
        .count("id", { as: 'count' });

        const dr = count.pop();
        return (dr && dr.count && Number(dr.count) > 0);
    }

    public static async checkLoginOnPage(conn: Knex, request: Request, response: Response) : Promise<[number, string]>
    {
        const token = request.cookies.interpreterToken ?? undefined;
        
        try
        {
            if (!token) throw new NonLoggedInUser("Intérprete não logado!"); 

            const result = await jwt.verify(token, process.env.SIGNUM_INTERPRETERS_JWT_SECRET as string);
            
            const intr = await conn<InterpreterAttributes>(Interpreter.databaseTable)
            .where({ id: result.interpreterId ?? undefined })
            .select("id", "name", "username")
            .first();
            
            return [ intr?.id ?? 0, intr?.name ?? '***' ];
        }
        catch (err)
        {
            throw new NonLoggedInUser("Intérprete não logado!", "/page/interpreters/login");
        }
    }

    public static async checkLoginOnScript(request: Request, response: Response) : Promise<number>
    {
        const token = request.cookies.interpreterToken ?? undefined;
        if (!token) throw new NonLoggedInUser("Intérprete não logado!"); 

        try
        {
            const result = await jwt.verify(token, process.env.SIGNUM_INTERPRETERS_JWT_SECRET as string);
            return result.interpreterId ?? 0;
        }
        catch (err) { throw new InvalidToken(); }
    }

    public static async login(conn: Knex, username: string, password: string) : Promise<[boolean, number]>
    {
        const intr = await conn<InterpreterAttributes>(Interpreter.databaseTable)
        .where({ username })
        .select('username', 'password_hash', 'id')
        .first();

        if (!intr)
            throw new DatabaseEntityNotFound("Intérprete não localizado!", Interpreter.databaseTable);

        if (await bcrypt.compare(password, intr.password_hash ?? ''))
            return [true, intr.id ?? 0];
        else
            return [false, intr.id ?? 0];
    }

    public async checkPassword(givenPassword: string)
    {
        return await bcrypt.compare(givenPassword, this.get("password_hash") ?? '');
    }

    public async changePassword(newPassword: string)
    {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        this.set("password_hash", hash);
    }

    public async getSingle(conn: Knex<any, any[]>): Promise<Interpreter> 
    {
        const gotten = await conn<InterpreterAttributes>(Interpreter.databaseTable)
        .select({ ...this.convertPropGroupToObjectWithValues([], conn, "select"), sessionsWorkedAt: conn.raw("COUNT(translation_sessions.id)"), totalMinutes: conn.raw("SUM(TIMESTAMPDIFF(MINUTE, translation_sessions.begin, translation_sessions.end))") })
        .leftJoin("translation_sessions", "interpreters.id", "translation_sessions.interpreter_id")
        .where(this.convertPrimaryKeysToObjectWithValues(Interpreter.primaryKeys))
        .first();

        return this.newInstanceFromDataRow(gotten) as Interpreter;
    }

    public async getCount(conn: Knex, searchKeywords: string) : Promise<number>
    {
        let queryBuilder = conn(Interpreter.databaseTable).count('id', { as: 'count' });

        if (searchKeywords.length > 3)
            queryBuilder.whereRaw("MATCH (name, description, username) AGAINST (?)", searchKeywords);

        let countDrs = await queryBuilder;
        let count = countDrs.pop()?.count;

        if (typeof count === "string")
            return Number.parseInt(count);
        else if (typeof count === "number")
            return count;
        else
            return 0;
    }

    public async getMultiple(conn: Knex, searchKeywords: string, orderBy: string, page?: number, numResultsOnPage?: number)
    {
        const queryBuilder = conn<InterpreterAttributes>(Interpreter.databaseTable)
        .select({ ...this.convertPropGroupToObjectWithValues([], conn, "select"), sessionsWorkedAt: conn.raw("COUNT(translation_sessions.id)"), totalMinutes: conn.raw("SUM(TIMESTAMPDIFF(MINUTE, translation_sessions.begin, translation_sessions.end))") })
        .leftJoin("translation_sessions", "interpreters.id", "translation_sessions.interpreter_id")
        .groupBy("interpreters.id");

        if (searchKeywords.length > 3)
            queryBuilder.whereRaw("MATCH (name, description, username) AGAINST (?)", searchKeywords);

        switch (orderBy)
        {
            case "sessionsWorkedAt": queryBuilder.orderBy("sessionsWorkedAt", "asc"); break;
            case "totalMinutes": queryBuilder.orderBy("totalMinutes", "asc"); break;
            case "name": queryBuilder.orderBy("name", "asc"); break;
            case "username": default: queryBuilder.orderBy("username", "asc"); break;
        }

        if (page && numResultsOnPage)
        {
	        const calcPage = (page - 1) * numResultsOnPage;
            queryBuilder.offset(calcPage);
            queryBuilder.limit(numResultsOnPage);
        }

        const rows = await queryBuilder as DataRow[];
        return rows.map( row => this.newInstanceFromDataRow(row) as Interpreter );
    }
}