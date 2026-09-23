import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UsuarioPayload, RequestConUsuario } from '../tipos.ts';

export function verificarToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    // Le decimos a TypeScript qué forma tiene lo que había adentro del token,
    // en vez de dejarlo como "any"
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as UsuarioPayload;
    (req as RequestConUsuario).usuario = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
