import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'express';
const express = pkg;
import type { Request, Response } from 'express';
import usuariosRutas from '../rutas/rutasUsuarios.ts';
import { verificarToken } from '../middlewares/verificarToken.ts';
import cors from 'cors';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
      console.error('Error al leer el archivo JSON previo:', error);
    }
  }

  historial.push(datosNuevos);
  fs.writeFileSync(filePath, JSON.stringify(historial, null, 2), 'utf-8');
}
app.get('/api/sensores', verificarToken, (req: Request, res: Response) => {
  if (!fs.existsSync(filePath)) {
    return res.json([]);
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los datos de sensores' });
  }
});
app.get('/api/sensores/ultimo', verificarToken, (req: Request, res: Response) => {
  if (!fs.existsSync(filePath)) {
    return res.json({ mensaje: 'No hay datos registrados aún' });
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const historial = JSON.parse(data);
    
    if (historial.length === 0) {
      return res.json({ mensaje: 'El historial está vacío' });
    }
    res.json(historial[historial.length - 1]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la última lectura' });
  }
});

app.listen(PORT_HTTP, () => {
  console.log(`[HTTP] Servidor Express corriendo en http://localhost:${PORT_HTTP}`);
});

const port = new SerialPort({
  path: 'COM5', 
  baudRate: 9600,
});
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

port.on('open', () => {
  console.log('[UART] Puerto serial abierto correctamente.');
});
let lineasBloque: string[] = [];
parser.on('data', (lineaCruda: string) => {
  const linea = lineaCruda.trim();
  if (linea.startsWith('---')) {
    procesarBloqueLimpio(lineasBloque);
    lineasBloque = []; 
  } else if (linea !== '') {
    lineasBloque.push(linea);
  }
});
function procesarBloqueLimpio(lineas: string[]) {
  let humedad: number | null = null;

  for (const linea of lineas) {
    if (linea.toLowerCase().includes('humedad')) {
      const textoLimpio = linea.replace('Humedad:', '').replace('%', '').trim();
      const valorNumerico = Number(textoLimpio);

      if (!isNaN(valorNumerico)) {
        humedad = valorNumerico;
      }
    }
  }
  if (humedad !== null) {
    const registro = {
      timestamp: new Date().toISOString(),
      humedadSuelo: humedad,
      conductividad: null,        // Pendiente de integración física
      temperaturaBME280: null,     // Pendiente de integración física
    };

    guardarEnJson(registro);
    console.log('[PLANT-OS] Nueva lectura registrada con éxito:', registro);
  }
}
port.on('error', (err) => {
  console.error('[UART Error]:', err.message);
});