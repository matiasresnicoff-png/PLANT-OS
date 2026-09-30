import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { leerUsuarios, guardarUsuarios } from '../usuariosData.ts';
import type {
  Usuario,
  RegistroBody,
  LoginBody,
  EditarPerfilBody,
  RequestConUsuario,
} from '../tipos.ts';

export async function registrarUsuario(req: Request, res: Response) {
  const body = req.body as RegistroBody;
  const nombre = body.nombre;
  const fechaNacimiento = body.fechaNacimiento;
  const mail = body.mail;
  const contraseña = body.contraseña;

  if (!nombre || !fechaNacimiento || !mail || !contraseña) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const usuarios = leerUsuarios();

  let yaExiste = false;
  for (let i = 0; i < usuarios.length; i = i + 1) {
    const usuarioActual = usuarios[i];
    if (usuarioActual !== undefined && usuarioActual.mail === mail) {
      yaExiste = true;
    }
  }

  if (yaExiste) {
    return res.status(409).json({ error: 'Ya existe un usuario con ese mail' });
  }

  const contraseñaHasheada = await bcrypt.hash(contraseña, 10);
  const nuevoUsuario: Usuario = {
    idUsuario: String(usuarios.length + 1),
    nombre: nombre,
    fechaNacimiento: fechaNacimiento,
    mail: mail,
    contraseña: contraseñaHasheada,
  };

  usuarios.push(nuevoUsuario);
  guardarUsuarios(usuarios);

  const usuarioSinContraseña = {
    idUsuario: nuevoUsuario.idUsuario,
    nombre: nuevoUsuario.nombre,
    fechaNacimiento: nuevoUsuario.fechaNacimiento,
    mail: nuevoUsuario.mail,
  };

  res.status(201).json(usuarioSinContraseña);
}

export async function loginUsuario(req: Request, res: Response) {
  const body = req.body as LoginBody;
  const mail = body.mail;
  const contraseña = body.contraseña;

  if (!mail || !contraseña) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const usuarios = leerUsuarios();

  let usuario: Usuario | undefined = undefined;
  for (let i = 0; i < usuarios.length; i = i + 1) {
    const usuarioActual = usuarios[i];
    if (usuarioActual !== undefined && usuarioActual.mail === mail) {
      usuario = usuarioActual;
    }
  }

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
  const usuarioDelToken = (req as RequestConUsuario).usuario;
  const idUsuario = usuarioDelToken.idUsuario;

  const usuarios = leerUsuarios();

  let usuario: Usuario | undefined = undefined;
  for (let i = 0; i < usuarios.length; i = i + 1) {
    const usuarioActual = usuarios[i];
    if (usuarioActual !== undefined && usuarioActual.idUsuario === idUsuario) {
      usuario = usuarioActual;
    }
  }

  if (!usuario) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const usuarioSinContraseña = {
    idUsuario: usuario.idUsuario,
    nombre: usuario.nombre,
    fechaNacimiento: usuario.fechaNacimiento,
    mail: usuario.mail,
  };

  res.status(200).json(usuarioSinContraseña);
}

export function editarPerfil(req: Request, res: Response) {
  const usuarioDelToken = (req as RequestConUsuario).usuario;
  const idUsuario = usuarioDelToken.idUsuario;

  const body = req.body as EditarPerfilBody;
  const nombre = body.nombre;
  const fechaNacimiento = body.fechaNacimiento;
  const mail = body.mail;

  const usuarios = leerUsuarios();

  let index = -1;
  for (let i = 0; i < usuarios.length; i = i + 1) {
    const usuarioActual = usuarios[i];
    if (usuarioActual !== undefined && usuarioActual.idUsuario === idUsuario) {
      index = i;
    }
  }

  if (index === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  // Con noUncheckedIndexedAccess activado, usuarios[index] puede ser
  // "undefined" para TypeScript aunque nosotros sepamos que existe (ya
  // encontramos el índice arriba). Por eso lo guardamos en una variable y
  // chequeamos, en vez de usar usuarios[index] directamente varias veces.
  const usuarioExistente = usuarios[index];
  if (usuarioExistente === undefined) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  if (nombre) usuarioExistente.nombre = nombre;
  if (fechaNacimiento) usuarioExistente.fechaNacimiento = fechaNacimiento;
  if (mail) usuarioExistente.mail = mail;

  guardarUsuarios(usuarios);

  const usuarioActualizado = {
    idUsuario: usuarioExistente.idUsuario,
    nombre: usuarioExistente.nombre,
    fechaNacimiento: usuarioExistente.fechaNacimiento,
    mail: usuarioExistente.mail,
  };

  res.status(200).json(usuarioActualizado);
}
