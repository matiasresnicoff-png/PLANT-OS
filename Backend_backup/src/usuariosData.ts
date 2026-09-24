import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { Usuario } from './tipos.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rutaArchivo = path.join(__dirname, '..', 'usuarios.JSON');

export function leerUsuarios(): Usuario[] {
  if (!fs.existsSync(rutaArchivo)) {
    return [];
  }
  const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
  return JSON.parse(contenido) as Usuario[];
}

export function guardarUsuarios(usuarios: Usuario[]): void {
  fs.writeFileSync(rutaArchivo, JSON.stringify(usuarios, null, 2), 'utf-8');
}
