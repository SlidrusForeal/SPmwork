import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export function authenticated(fn: any) {
    return async (req: any, res: any) => {
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ error: 'Нет токена' });
        const token = auth.split(' ')[1];
        try {
            const user = jwt.verify(token, JWT_SECRET) as any;
            req.user = user;
            return await fn(req, res);
        } catch {
            return res.status(401).json({ error: 'Неверный токен' });
        }
    };
}
