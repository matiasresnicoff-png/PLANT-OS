import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { leerUsuarios, guardarUsuarios } from '../usuariosData.ts';
export async function registrarUsuario(req: Request, res: Response) {
  const { nombre, fechaNacimiento, mail, contraseña } = req.body;
  if (!nombre || !fechaNacimiento || !mail || !contraseña) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  const usuarios = leerUsuarios();
  const yaExiste = usuarios.some((u) => u.mail === mail);
  if (yaExiste) {
    return res.status(409).json({ error: 'Ya existe un usuario con ese mail' });
  }
  const contraseñaHasheada = await bcrypt.hash(contraseña, 10);
  const nuevoUsuario = {
    idUsuario: String(usuarios.length + 1),
    nombre,
    fechaNacimiento,
    mail,
    contraseña: contraseñaHasheada,
  };
  usuarios.push(nuevoUsuario);
  guardarUsuarios(usuarios);
  const { contraseña: _, ...usuarioSinContraseña } = nuevoUsuario;
  res.status(201).json(usuarioSinContraseña);
}
export async function loginUsuario(req: Request, res: Response) {
  const { mail, contraseña } = req.body;

  if (!mail || !contraseña) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const usuarios = leerUsuarios();
  const usuario = usuarios.find((u) => u.mail === mail);

  if (!usuario) {
    return res.status(401).json({ error: 'Mail o contraseña incorrectos' });
  }

  const contraseñaCorrecta = await bcrypt.compare(contraseña, usuario.contraseña);
  if (!contraseñaCorrecta) {
    return res.status(401).json({ error: 'Mail o contraseña incorrectos' });
  }

  const token = jwt.sign(
    { idUsuario: usuario.idUsuario, mail: usuario.mail },
    process.env.JWT_SECRET as string,
    { expiresIn: '2h' }
  );

  res.status(200).json({
    token,
    usuario: {
      idUsuario: usuario.idUsuario,
      nombre: usuario.nombre,
      mail: usuario.mail,
    },
  });
}