// Simulador que imita una lectura real del Arduino: genera un valor
// "crudo" al azar (como el que manda analogRead(), de 0 a 1023) y lo
// guarda en sensores.json pasado por la MISMA conversión a porcentaje que
// usa end1.ts. Sirve para probar que el arreglo de humedad funciona bien,
// sin necesitar el Arduino enchufado.
//
// Diferencia con simuladorSensores.ts: ese otro simulador inventa
// directamente un porcentaje de humedad (25 a 75) sin pasar por ninguna
// conversión. Este simula el "antes" (el número crudo del sensor) para
// probar la conversión de verdad, de punta a punta.
//
// Cómo usarlo: en una terminal corré "npm run simulador-arduino". Para
// parar: Ctrl + C. (No hace falta tener el backend principal corriendo al
// mismo tiempo para esto — este simulador escribe directo en el archivo.)

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath: string = path.join(__dirname, 'sensores.json');

interface RegistroLectura {
  timestamp: string;
  humedadSuelo: number | null;
  conductividad: number | null;
  temperaturaBME280: number | null;
}

// Misma conversión que en end1.ts: el sensor da un número crudo (0 a
// 1023), y en este sensor en particular, cuanto más bajo es ese número,
// más mojada está la tierra (va al revés de lo típico).
const HUMEDAD_SECO: number = 1023;
const HUMEDAD_MOJADO: number = 400;

function convertirHumedadAPorcentaje(valorCrudo: number): number {
  let porcentaje: number = ((HUMEDAD_SECO - valorCrudo) / (HUMEDAD_SECO - HUMEDAD_MOJADO)) * 100;

  if (porcentaje < 0) porcentaje = 0;
  if (porcentaje > 100) porcentaje = 100;

  return 100 - Math.round(porcentaje);
}

// Devuelve un número entero al azar entre "minimo" y "maximo" (incluidos).
function numeroEnteroAlAzar(minimo: number, maximo: number): number {
  return Math.round(Math.random() * (maximo - minimo) + minimo);
}

// Devuelve un número con un decimal al azar entre "minimo" y "maximo".
function numeroConDecimalAlAzar(minimo: number, maximo: number): number {
  const numero: number = Math.random() * (maximo - minimo) + minimo;
  return Math.round(numero * 10) / 10;
}

// Misma lógica que en end1.ts: lee el historial, le agrega el registro
// nuevo, y lo vuelve a guardar.
function guardarEnJson(datosNuevos: RegistroLectura): void {
  let historial: RegistroLectura[] = [];

  try {
    const contenidoTexto: string = fs.readFileSync(filePath, 'utf-8');
    historial = JSON.parse(contenidoTexto);
  } catch {
    historial = [];
  }

  historial.push(datosNuevos);

  const textoJson: string = JSON.stringify(historial, null, 2);
  fs.writeFileSync(filePath, textoJson, 'utf-8');
}

function generarLecturaFalsa(): void {
  // Simulamos el valor crudo que mandaría analogRead(), entre 300 y 1023
  // (todo el rango posible, para que a veces de "seco" y a veces "mojado").
  const valorCrudo: number = numeroEnteroAlAzar(300, 1023);

  const registro: RegistroLectura = {
    timestamp: new Date().toISOString(),
    humedadSuelo: convertirHumedadAPorcentaje(valorCrudo),
    conductividad: valorCrudo,
    temperaturaBME280: numeroConDecimalAlAzar(16, 30),
  };

  guardarEnJson(registro);
  console.log('[SIMULADOR ARDUINO] Valor crudo generado:', valorCrudo, '-> Lectura guardada:', registro);
}

console.log('[SIMULADOR ARDUINO] Arrancó el simulador que imita al Arduino de verdad.');
console.log('[SIMULADOR ARDUINO] Genera una lectura falsa cada 5 segundos (como el Arduino real).');
console.log('[SIMULADOR ARDUINO] Para parar: Ctrl + C');

generarLecturaFalsa();
setInterval(generarLecturaFalsa, 5 * 1000);
