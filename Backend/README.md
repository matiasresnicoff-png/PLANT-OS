# PLANT-OS — Backend

Backend del proyecto PLANT-OS (monitoreo de una planta con sensores). Hecho con Node.js, TypeScript y Express. Lee los datos del Arduino por puerto serie, los guarda, y expone una API para que el frontend registre usuarios, loguee, y consulte las lecturas de los sensores.

## Cómo correrlo

1. Instalar las dependencias:

   ```
   npm install
   ```

2. Crear un archivo `.env` en la carpeta `Backend` con:

   ```
   JWT_SECRET=alguna_clave_secreta
   ```

3. Levantar el servidor:

   ```
   npm run principal
   ```

   Por defecto corre en `http://localhost:3000`. Necesita que el Arduino esté conectado por el puerto `COM3` para recibir lecturas nuevas (si no está conectado, el servidor igual levanta, simplemente no va a recibir datos de sensores nuevos).

4. Para chequear que el código esté bien tipado:

   ```
   npm run lint
   ```

## Rutas de la API

Todas las rutas devuelven y reciben JSON.

### Usuarios

**POST /api/usuarios** — Registrar un usuario nuevo.

- Body: `{ nombre: string, fechaNacimiento: string, mail: string, contraseña: string }`
- Respuesta 201: el usuario creado (sin la contraseña).
- Errores: 400 si falta algún dato, 409 si ya existe un usuario con ese mail.

**POST /api/login** — Iniciar sesión.

- Body: `{ mail: string, contraseña: string }`
- Respuesta 200: `{ token: string, usuario: { idUsuario, nombre, mail } }`
- Errores: 400 si falta algún dato, 401 si el mail o la contraseña son incorrectos.

**GET /api/usuarios/perfil** — Ver el perfil del usuario logueado.

- Requiere header `Authorization: Bearer <token>`
- Respuesta 200: datos del usuario (sin la contraseña).
- Errores: 401 si no mandaste el token o es inválido/expiró, 404 si el usuario no existe.

**PUT /api/usuarios/perfil** — Editar el perfil del usuario logueado.

- Requiere header `Authorization: Bearer <token>`
- Body: `{ nombre?: string, fechaNacimiento?: string, mail?: string }` (todos opcionales, se actualiza solo lo que mandes)
- Respuesta 200: el usuario actualizado (sin la contraseña).
- Errores: 401 si no mandaste el token o es inválido/expiró, 404 si el usuario no existe.

### Sensores

**GET /api/sensores** — Devuelve el historial completo de lecturas (humedad, conductividad y temperatura, con fecha y hora de cada una).

- Requiere header `Authorization: Bearer <token>`
- Respuesta 200: array de lecturas.
- Errores: 401 si no mandaste el token o es inválido/expiró.

**GET /api/sensores/ultimo** — Devuelve la última lectura registrada.

- Requiere header `Authorization: Bearer <token>`
- Respuesta 200: la última lectura, o un mensaje si todavía no hay datos guardados.
- Errores: 401 si no mandaste el token o es inválido/expiró.

## Autenticación

El login devuelve un token (JWT) que dura 2 horas. Para las rutas que lo piden, hay que mandarlo en el header `Authorization` con el formato `Bearer <token>`.

## Persistencia

Los datos se guardan en archivos JSON, no en una base de datos: `usuarios.JSON` para los usuarios y `src/pruebas/sensores.json` para las lecturas de los sensores.
