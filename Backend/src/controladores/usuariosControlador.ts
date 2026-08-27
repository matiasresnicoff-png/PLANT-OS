import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
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