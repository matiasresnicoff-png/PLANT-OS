import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UsuarioPayload, RequestConUsuario } from '../tipos.ts';

// Este es el "middleware" de autenticación: se ejecuta ANTES que la ruta
// protegida (por eso va como segundo argumento en app.get/put, antes de la
// función de la ruta). Si el token es válido, deja pasar la petición con
// next(); si no, corta acá mismo con un 401 y la ruta protegida ni se llega
// a ejecutar.
export function verificarToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  let token: string | undefined = undefined;
  if (authHeader) {
    const partesDelHeader = authHeader.split(' ');
    token = partesDelHeader[1];
  }

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
