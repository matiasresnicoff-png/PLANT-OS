// Script chiquito solo para probar si el Arduino está mandando datos por el
// puerto serie. No guarda nada en ningún archivo, no levanta el servidor
// Express: solo abre el puerto y muestra en consola cada línea que llega.
//
// Cómo usarlo: en la terminal de VS Code, parados en la carpeta Backend,
// corré "npm run probar-serial". Para parar: Ctrl + C.
//
// Si acá tampoco aparece nada, el problema está en el Arduino (el sketch,
// el cable o el sensor). Si acá SÍ aparecen líneas, el Arduino está bien y
// el problema está en el backend principal (end1.ts).

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const port = new SerialPort({
  path: 'COM3',
  baudRate: 9600,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

port.on('open', function () {
  console.log('[PRUEBA] Puerto COM3 abierto. Esperando datos del Arduino...');
});

parser.on('data', function (lineaCruda: string) {
  console.log('[PRUEBA] Llegó una línea:', lineaCruda);
});

port.on('error', function (err: Error) {
  console.error('[PRUEBA] Error al abrir o leer el puerto:', err.message);
});
