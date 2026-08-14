import * as fs from 'node:fs';
let rutaArchivo = './src/ejemplo.txt';
let mensaje = '¡Hola! Este es mi primer archivo guardado con Node y TypeScript.';
fs.writeFileSync(rutaArchivo, mensaje);
console.log('Archivo creado con éxito.');
let contenidoLeido = fs.readFileSync(rutaArchivo, 'utf-8');
console.log('Contenido del archivo:');
console.log(contenidoLeido);