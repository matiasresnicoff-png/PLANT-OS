import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { Usuario } from './tipos.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rutaArchivo = path.join(__dirname, '..', 'usuarios.JSON');

// Este archivo hace de "base de datos" de usuarios: en vez de una base de
// datos de verdad, leemos y escribimos todo en usuarios.JSON.

// Lee todos los usuarios guardados. Si el archivo todavía no existe
// (primera vez que se usa la app), devuelve una lista vacía.
export function leerUsuarios(): Usuario[] {
  try {
    const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
    return JSON.parse(contenido) as Usuario[];
  } catch {
    // Si el archivo todavía no existe (primera vez que se usa la app), arrancamos sin usuarios.
    return [];
  }
}

// Sobreescribe el archivo con la lista completa de usuarios que le
// pasamos. Se usa después de agregar un usuario nuevo o editar uno existente.
export function guardarUsuarios(usuarios: Usuario[]): void {
  fs.writeFileSync(rutaArchivo, JSON.stringify(usuarios, null, 2), 'utf-8');
}
