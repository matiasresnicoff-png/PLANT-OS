import type { Request } from 'express';

// Cómo se guarda un usuario en usuarios.JSON
export interface Usuario {
  idUsuario: string;
  nombre: string;
  fechaNacimiento: string;
  mail: string;
  contraseña: string;
}

// Lo que guardamos adentro del token (JWT) cuando alguien se loguea
export interface UsuarioPayload {
  idUsuario: string;
  mail: string;
}

// Un Request normal de Express, pero con el campo "usuario" que le agrega
// el middleware verificarToken después de validar el token
export type RequestConUsuario = Request & { usuario: UsuarioPayload };

// Body esperado en POST /api/usuarios (registro)
export interface RegistroBody {
  nombre: string;
  fechaNacimiento: string;
  mail: string;
  contraseña: string;
}

// Body esperado en POST /api/login
export interface LoginBody {
  mail: string;
  contraseña: string;
}

// Body esperado en PUT /api/usuarios/perfil (todos los campos son opcionales,
// se actualiza solo lo que se manda)
export interface EditarPerfilBody {
  nombre?: string;
  fechaNacimiento?: string;
  mail?: string;
}
