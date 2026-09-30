import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';

// Este es el servidor principal: levanta la API con Express (rutas de
// usuarios y de sensores) y además escucha el puerto serie para recibir
// las lecturas que manda el Arduino.

import { registrarUsuario, loginUsuario, verPerfil, editarPerfil } from '../controladores/usuariosControlador.ts';
import { verificarToken } from '../middlewares/verificarToken.ts';

const app = express();
const PORT_HTTP: number = 3000;

app.use(cors());
app.use(express.json());

// Rutas de usuarios. verificarToken es el middleware que chequea el JWT
// antes de dejar pasar la petición a verPerfil/editarPerfil.
app.post('/api/usuarios', registrarUsuario);
app.post('/api/login', loginUsuario);
app.get('/api/usuarios/perfil', verificarToken, verPerfil);
app.put('/api/usuarios/perfil', verificarToken, editarPerfil);

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

// Guarda una lectura nueva en sensores.json: lee el historial que ya
// había, le agrega la lectura nueva al final, y vuelve a guardar todo.
function guardarEnJson(datosNuevos: RegistroLectura): void {
  let historial: RegistroLectura[] = [];

  try {
    let contenidoTexto: string = fs.readFileSync(filePath, 'utf-8');
    historial = JSON.parse(contenidoTexto);
  } catch {
    // Si el archivo todavía no existe (o está corrupto), arrancamos con el historial vacío.
    historial = [];
  }

  historial.push(datosNuevos);

  let textoJson: string = JSON.stringify(historial, null, 2);
  fs.writeFileSync(filePath, textoJson, 'utf-8');
}

// Ruta: GET /api/sensores — devuelve todo el historial de lecturas guardadas.
app.get('/api/sensores', verificarToken, function (req: Request, res: Response) {
  try {
    let contenidoTexto: string = fs.readFileSync(filePath, 'utf-8');
    let datosCargados: RegistroLectura[] = JSON.parse(contenidoTexto);
    res.json(datosCargados);
  } catch {
    // Si el archivo todavía no existe (o hay algún problema al leerlo), no hay datos para mostrar.
    res.json([]);
  }
});

// Ruta: GET /api/sensores/ultimo — devuelve solamente la lectura más reciente.
app.get('/api/sensores/ultimo', verificarToken, function (req: Request, res: Response) {
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
  } catch {
    // Si el archivo todavía no existe (o hay algún problema al leerlo), avisamos que no hay datos.
    res.json({ mensaje: 'No hay datos registrados aún' });
  }
});

// Levanta el servidor HTTP y muestra en consola qué rutas hay disponibles.
app.listen(PORT_HTTP, function () {
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

// Acá abrimos la conexión con el Arduino por el puerto serie (COM3).
// "parser" separa lo que llega en líneas de texto (una lectura por línea).
const port = new SerialPort({
  path: 'COM3',
  baudRate: 9600,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

port.on('open', function () {
  console.log('[UART] Puerto serial abierto correctamente.');
});

// El Arduino manda las lecturas de a "bloques": varias líneas seguidas
// (una por sensor) y al final una línea que arranca con "---" avisando que
// el bloque terminó. Mientras tanto vamos juntando las líneas acá.
let lineasBloque: string[] = [];

parser.on('data', function (lineaCruda: string) {
  let lineaLimpia: string = lineaCruda.trim();

  let empiezaConGuiones: boolean = lineaLimpia.startsWith('---');

  if (empiezaConGuiones === true) {
    // Llegó el separador: ya tenemos el bloque completo, lo procesamos
    // y vaciamos la lista para empezar a juntar el próximo.
    procesarBloqueLimpio(lineasBloque);
    lineasBloque = [];
  } else {
    if (lineaLimpia !== '') {
      lineasBloque.push(lineaLimpia);
    }
  }
});

// Recibe todas las líneas de un bloque (ya sin la línea "---" del final) y
// busca ahí adentro la temperatura y la conductividad, línea por línea. Al
// final, si encontró algún dato, arma el registro y lo guarda.
function procesarBloqueLimpio(lineas: string[]): void {
  let temperatura: number | null = null;
  let conductividad: number | null = null;

  let totalLineas: number = lineas.length;

  for (let i = 0; i < totalLineas; i = i + 1) {
    let lineaActual: string | undefined = lineas[i];

    if (lineaActual !== undefined) {
      let lineaEnMinusculas: string = lineaActual.toLowerCase();

      let tienePalabraTemperatura: boolean = lineaEnMinusculas.includes('temperatura');

      if (tienePalabraTemperatura === true) {
        let textoSinEtiqueta: string = lineaActual.replace('Temperatura:', '').trim();

        if (textoSinEtiqueta !== '') {
          let numeroConvertido: number = Number(textoSinEtiqueta);
          temperatura = numeroConvertido;
        }
      }

      let tienePalabraConductividad: boolean = lineaEnMinusculas.includes('conductividad');

      if (tienePalabraConductividad === true) {
        let textoSinEtiqueta: string = lineaActual.replace('Conductividad:', '').trim();

        if (textoSinEtiqueta !== '') {
          let numeroConvertido: number = Number(textoSinEtiqueta);
          conductividad = numeroConvertido;
        }
      }
    }
  }

  let llegoAlgunDato: boolean = temperatura !== null || conductividad !== null;

  if (llegoAlgunDato === true) {
    let fechaActual: string = new Date().toISOString();

    // Por ahora "humedad del suelo" y "conductividad" van unificadas: las
    // dos muestran el mismo valor del sensor de humedad de 2 patitas,
    // hasta que llegue el sensor de conductividad real y las separemos.
    let registro: RegistroLectura = {
      timestamp: fechaActual,
      humedadSuelo: conductividad,
      conductividad: conductividad,
      temperaturaBME280: temperatura,
    };

    guardarEnJson(registro);
    console.log('[PLANT-OS] Nueva lectura registrada con éxito:', registro);
  }
}

port.on('error', function (err: Error) {
  console.error('[UART Error]:', err.message);
});