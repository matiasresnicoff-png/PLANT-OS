import * as fs from 'node:fs';

const rutaArchivo = './src/holamundo.txt';
const mensaje = 'Hola Mundo!';

fs.writeFileSync(rutaArchivo, mensaje);
console.log('¡Archivo "holamundo.txt" creado con éxito en src!');