import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// usuarios.JSON está en Backend, y este archivo está en Backend/src,
// por eso subimos un nivel con '..'
const rutaArchivo = path.join(__dirname, '..', 'usuarios.JSON');

export function leerUsuarios(): any[] {
  if (!fs.existsSync(rutaArchivo)) {
    return [];
  }
  const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
  return JSON.parse(contenido);
}

export function guardarUsuarios(usuarios: any[]): void {
  fs.writeFileSync(rutaArchivo, JSON.stringify(usuarios, null, 2), 'utf-8');
}