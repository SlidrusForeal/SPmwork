// lib/auth.ts
import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';

const JWT_SECRET = process.env.JWT_SECRET!;

export function authenticated(handler: (req: NextApiRequest & { user: any }, res: NextApiResponse) => Promise<any>) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ error: 'Нет токена' });
        const token = auth.split(' ')[1];
        try {
            const user = jwt.verify(token, JWT_SECRET);
            // @ts-ignore
            return await handler({ ...req, user }, res);
        } catch {
            return res.status(401).json({ error: 'Неверный токен' });
        }
    };
}
