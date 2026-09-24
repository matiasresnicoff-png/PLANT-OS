// Simulador "berreta": genera lecturas de sensores falsas (humedad,
// temperatura y conductividad) y las guarda en el mismo archivo que usa
// end1.ts. Sirve para probar la app y ver los gráficos con datos mientras
// no está conectado el sensor de verdad.
//
// Cómo usarlo: en una terminal corré el backend como siempre
// (npm run principal), y en OTRA terminal corré este simulador
// (npm run simulador-sensores). Los dos tienen que estar corriendo al
// mismo tiempo. Para parar el simulador: Ctrl + C.

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

// Devuelve un número al azar entre "minimo" y "maximo", con un decimal.
function numeroAlAzar(minimo: number, maximo: number): number {
  const numero: number = Math.random() * (maximo - minimo) + minimo;
  return Math.round(numero * 10) / 10;
}

// Misma lógica que en end1.ts: lee el historial, le agrega el registro
// nuevo, y lo vuelve a guardar.
function guardarEnJson(datosNuevos: RegistroLectura): void {
  let historial: RegistroLectura[] = [];

  const existeArchivo: boolean = fs.existsSync(filePath);

  if (existeArchivo === true) {
    try {
      const contenidoTexto: string = fs.readFileSync(filePath, 'utf-8');
      historial = JSON.parse(contenidoTexto);
    } catch (error) {
      console.error('Error al leer el archivo JSON previo:', error);
    }
  }

  historial.push(datosNuevos);

  const textoJson: string = JSON.stringify(historial, null, 2);
  fs.writeFileSync(filePath, textoJson, 'utf-8');
}

function generarLecturaFalsa(): void {
  const registro: RegistroLectura = {
    timestamp: new Date().toISOString(),
    humedadSuelo: numeroAlAzar(25, 75), // %
    temperaturaBME280: numeroAlAzar(16, 30), // °C
    conductividad: numeroAlAzar(300, 2200), // µS/cm
  };

  guardarEnJson(registro);
  console.log('[SIMULADOR] Lectura falsa generada:', registro);
}

console.log('[SIMULADOR] Arrancó el simulador berreta de sensores.');
console.log('[SIMULADOR] Genera una lectura falsa cada 10 segundos.');
console.log('[SIMULADOR] Para parar: Ctrl + C');

// Genera una lectura apenas arranca, y después una nueva cada 10 segundos.
generarLecturaFalsa();
setInterval(generarLecturaFalsa, 10 * 1000);
