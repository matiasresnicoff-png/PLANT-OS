import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import fs from 'fs';
import path from 'path';
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';

import usuariosRutas from '../../rutas/rutasUsuarios.js';
import { verificarToken } from '../../middlewares/verificarToken.js';

const app = express();
const PORT_HTTP: number = 3000;

app.use(cors());
app.use(express.json());

// Enganchamos el enrutador de usuarios (aquí residen los POST, PUT, etc.)
app.use('/api', usuariosRutas);

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

// Endpoints de sensores
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

// Función para imprimir en consola todas las rutas (incluye router principal y sub-rutas de usuarios)
function mostrarRutas() {
  console.log('=== LISTA DE RUTAS REGISTRADAS EN EL BACKEND ===');
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      // Rutas directas en app (como /api/sensores)
      let metodo = Object.keys(middleware.route.methods)[0].toUpperCase();
      console.log(`[HTTP] ${metodo} -> ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      // Rutas importadas desde usuariosRutas (/api/...)
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          let metodo = Object.keys(handler.route.methods)[0].toUpperCase();
          console.log(`[HTTP] ${metodo} -> /api${handler.route.path}`);
        }
      });
    }
  });
  console.log('================================================');
}

app.listen(PORT_HTTP, () => {
  console.log(`[HTTP] Servidor Express corriendo en http://localhost:${PORT_HTTP}`);
  mostrarRutas();
});

// Lectura de Puerto Serie
const port = new SerialPort({
  path: 'COM5', // ¡Ajustar al COM del colegio!
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