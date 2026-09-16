import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';

import usuariosRutas from '../rutas/rutasUsuarios.ts';
import { verificarToken } from '../middlewares/verificarToken.ts';

const app = express();
const PORT_HTTP: number = 3000;

app.use(cors());
app.use(express.json());

app.use('/api', usuariosRutas);

// Solución para __dirname en ES Modules / Node 22
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath: string = path.join(__dirname, 'sensores.json');

interface RegistroLectura {
  timestamp: string;
  humedadSuelo: number | null;
  conductividad: number | null;
  temperaturaBME280: number | null;
}

function guardarEnJson(datosNuevos: RegistroLectura): void {
  let historial: RegistroLectura[] = [];

  let existeArchivo: boolean = fs.existsSync(filePath);

  if (existeArchivo === true) {
    try {
      let contenidoTexto: string = fs.readFileSync(filePath, 'utf-8');
      historial = JSON.parse(contenidoTexto);
    } catch (error) {
      console.error('Error al leer el archivo JSON previo:', error);
    }
  }

  historial.push(datosNuevos);

  let textoJson: string = JSON.stringify(historial, null, 2);
  fs.writeFileSync(filePath, textoJson, 'utf-8');
}

app.get('/api/sensores', verificarToken, (req: Request, res: Response) => {
  let existeArchivo: boolean = fs.existsSync(filePath);

  if (existeArchivo === false) {
    return res.json([]);
  }

  try {
    let contenidoTexto: string = fs.readFileSync(filePath, 'utf-8');
    let datosCargados: RegistroLectura[] = JSON.parse(contenidoTexto);
    res.json(datosCargados);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los datos de sensores' });
  }
});

app.get('/api/sensores/ultimo', verificarToken, (req: Request, res: Response) => {
  let existeArchivo: boolean = fs.existsSync(filePath);

  if (existeArchivo === false) {
    return res.json({ mensaje: 'No hay datos registrados aún' });
  }

  try {
    let contenidoTexto: string = fs.readFileSync(filePath, 'utf-8');
    let historial: RegistroLectura[] = JSON.parse(contenidoTexto);

    let cantidadDeElementos: number = historial.length;

    if (cantidadDeElementos === 0) {
      return res.json({ mensaje: 'El historial está vacío' });
    }

    let posicionUltimo: number = cantidadDeElementos - 1;
    let ultimoRegistro: RegistroLectura | undefined = historial[posicionUltimo];

    if (ultimoRegistro !== undefined) {
      res.json(ultimoRegistro);
    } else {
      res.json({ mensaje: 'No se encontró el último registro' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la última lectura' });
  }
});

app.listen(PORT_HTTP, () => {
  console.log(`[HTTP] Servidor Express corriendo en http://localhost:${PORT_HTTP}`);
  console.log('=== RUTAS DISPONIBLES EN TU BACKEND ===');
  console.log('[HTTP] POST -> /api/usuarios (Registrar)');
  console.log('[HTTP] POST -> /api/login (Login)');
  console.log('[HTTP] GET  -> /api/usuarios/perfil (Ver Perfil)');
  console.log('[HTTP] PUT  -> /api/usuarios/perfil (Editar Perfil)');
  console.log('[HTTP] GET  -> /api/sensores (Ver Historial Sensores)');
  console.log('[HTTP] GET  -> /api/sensores/ultimo (Ver Último Sensor)');
  console.log('=======================================');
});

const port = new SerialPort({
  path: 'COM3',
  baudRate: 9600,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

port.on('open', () => {
  console.log('[UART] Puerto serial abierto correctamente.');
});

let lineasBloque: string[] = [];

parser.on('data', (lineaCruda: string) => {
  let lineaLimpia: string = lineaCruda.trim();

  let empiezaConGuiones: boolean = lineaLimpia.startsWith('---');

  if (empiezaConGuiones === true) {
    procesarBloqueLimpio(lineasBloque);
    lineasBloque = [];
  } else {
    if (lineaLimpia !== '') {
      lineasBloque.push(lineaLimpia);
    }
  }
});

function procesarBloqueLimpio(lineas: string[]): void {
  let humedad: number | null = null;

  let totalLineas: number = lineas.length;

  for (let i = 0; i < totalLineas; i = i + 1) {
    let lineaActual: string | undefined = lineas[i];

    if (lineaActual !== undefined) {
      let lineaEnMinusculas: string = lineaActual.toLowerCase();
      let tienePalabraHumedad: boolean = lineaEnMinusculas.includes('humedad');

      if (tienePalabraHumedad === true) {
        let paso1: string = lineaActual.replace('Humedad:', '');
        let paso2: string = paso1.replace('%', '');
        let textoSinEspacios: string = paso2.trim();

        if (textoSinEspacios !== '') {
          let numeroConvertido: number = Number(textoSinEspacios);
          humedad = numeroConvertido;
        }
      }
    }
  }

  if (humedad !== null) {
    let fechaActual: string = new Date().toISOString();

    let registro: RegistroLectura = {
      timestamp: fechaActual,
      humedadSuelo: humedad,
      conductividad: null,
      temperaturaBME280: null,
    };

    guardarEnJson(registro);
    console.log('[PLANT-OS] Nueva lectura registrada con éxito:', registro);
  }
}

port.on('error', (err: Error) => {
  console.error('[UART Error]:', err.message);
});