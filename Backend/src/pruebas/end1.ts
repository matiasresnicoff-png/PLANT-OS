import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'express';
const express = pkg;
import type { Request, Response } from 'express';
import usuariosRutas from '../rutas/rutasUsuarios.ts';
import cors from 'cors';

// Definimos __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// CONFIGURACIÓN DE EXPRESS (El Servidor Web)
// ==========================================
const app = express();
const PORT_HTTP = 3000;
app.use(cors());
app.use(express.json()); 
app.use('/api', usuariosRutas);

const filePath = path.join(__dirname, 'sensores.json');

function guardarEnJson(datosNuevos: object) {
  let historial: object[] = [];

  if (fs.existsSync(filePath)) {
    try {
      const archivoActual = fs.readFileSync(filePath, 'utf-8');
      historial = JSON.parse(archivoActual);
    } catch (error) {
      console.error('Error leyendo el JSON previo:', error);
    }
  }

  historial.push(datosNuevos);
  fs.writeFileSync(filePath, JSON.stringify(historial, null, 2), 'utf-8');
}

// ------------------------------------------
// ENDPOINTS
// ------------------------------------------
app.get('/api/sensores', (req: Request, res: Response) => {
  if (!fs.existsSync(filePath)) {
    return res.json([]);
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Error al leer los datos de los sensores' });
  }
});

app.get('/api/sensores/ultimo', (req: Request, res: Response) => {
  if (!fs.existsSync(filePath)) {
    return res.json({ mensaje: 'No hay datos todavía' });
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const historial = JSON.parse(data);
    if (historial.length === 0) {
      return res.json({ mensaje: 'El historial está vacío' });
    }
    res.json(historial[historial.length - 1]);
  } catch (error) {
    res.status(500).json({ error: 'Error al leer el último dato' });
  }
});

app.listen(PORT_HTTP, () => {
  console.log(`Servidor web corriendo en http://localhost:${PORT_HTTP}`);
});


// ==========================================
// CONFIGURACIÓN DEL PUERTO SERIAL (Arduino)
// ==========================================
const port = new SerialPort({
  path: 'COM5',
  baudRate: 9600,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

port.on('open', () => {
  console.log('Puerto serial COM5 abierto correctamente.');
});

// Buffer temporal para ir guardando las líneas del bloque actual
let bufferBloque: string[] = [];

parser.on('data', (lineaCruda: string) => {
  const linea = lineaCruda.trim();
  console.log('Recibido:', linea); // Para que veas qué va llegando

  // Si encontramos la línea de guiones, cerramos el bloque y procesamos
  if (linea.startsWith('---')) {
    processarBloque(bufferBloque);
    bufferBloque = []; // Vaciamos el buffer para el próximo bloque
  } else if (linea !== '') {
    // Si no es línea vacía, la acumulamos
    bufferBloque.push(linea);
  }
});

// Función para extraer los números usando expresiones regulares de las líneas de texto
function processarBloque(lineas: string[]) {
  let temperatura: number | null = null;
  let humedad: number | null = null;
  let conductividad: number | null = null;

  for (const l of lineas) {
    const match = l.match(/-?\d+(\.\d+)?/);
    if (!match) continue;

    const valor = Number(match[0]);

    if (l.toLowerCase().includes('temperatura')) {
      temperatura = valor;
    } else if (l.toLowerCase().includes('humedad')) {
      humedad = valor;
    } else if (l.toLowerCase().includes('conductividad')) {
      conductividad = valor;
    }
  }

  // Si pudimos capturar al menos los datos principales, armamos el registro
  if (temperatura !== null && humedad !== null && conductividad !== null) {
    const registro = {
      timestamp: new Date().toISOString(),
      humedadSuelo: humedad,
      conductividad: conductividad,
      temperaturaBME280: temperatura,
    };

    guardarEnJson(registro);
    console.log('¡Bloque procesado y guardado con éxito!', registro);
  } else {
    console.log('No se pudieron extraer todos los datos del bloque:', lineas);
  }
}

port.on('error', (err) => {
  console.error('Error en el puerto serial:', err.message);
});