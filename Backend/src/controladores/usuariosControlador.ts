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
export function verPerfil(req: Request, res: Response) {
  const { idUsuario } = (req as any).usuario;
  const usuarios = leerUsuarios();
  const usuario = usuarios.find((u) => u.idUsuario === idUsuario);

  if (!usuario) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const { contraseña: _, ...usuarioSinContraseña } = usuario;
  res.status(200).json(usuarioSinContraseña);
}

export function editarPerfil(req: Request, res: Response) {
  const { idUsuario } = (req as any).usuario;
  const { nombre, fechaNacimiento, mail } = req.body;

  const usuarios = leerUsuarios();
  const index = usuarios.findIndex((u) => u.idUsuario === idUsuario);

  if (index === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  if (nombre) usuarios[index].nombre = nombre;
  if (fechaNacimiento) usuarios[index].fechaNacimiento = fechaNacimiento;
  if (mail) usuarios[index].mail = mail;

  guardarUsuarios(usuarios);

  const { contraseña: _, ...usuarioActualizado } = usuarios[index];
  res.status(200).json(usuarioActualizado);
}