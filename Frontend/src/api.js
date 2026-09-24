// Funciones compartidas para hablar con el backend de forma "protegida".
// Es el reemplazo de andar copiando el mismo chequeo de token en cada
// pantalla: acá se centraliza una sola vez. Cualquier pantalla que necesite
// pedir datos protegidos usa fetchProtegido() en vez de fetch() directo.
//
// Qué hace fetchProtegido() antes de cada pedido:
//   1. Si no hay token guardado, ni siquiera manda el pedido: avisa y manda
//      al login.
//   2. Si el backend contesta 401 (token inválido o vencido), borra el
//      token viejo y manda al login también.
// En los dos casos devuelve null, así que en la pantalla alcanza con
// revisar "si no hay respuesta, cortar acá" (ver ejemplos en humedad.js,
// perfil.js, etc.).

function obtenerToken() {
  return localStorage.getItem('token');
}

function irAlLogin(mensaje) {
  mostrarToast(mensaje, true);
  setTimeout(() => {
    window.location.href = '4. iniciar-sesion.html';
  }, 1200);
}

async function fetchProtegido(url, opciones = {}) {
  const token = obtenerToken();

  if (!token) {
    irAlLogin('Tenés que iniciar sesión primero');
    return null;
  }

  const res = await fetch(url, {
    ...opciones,
    headers: {
      ...(opciones.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    irAlLogin('Tu sesión expiró. Iniciá sesión de nuevo.');
    return null;
  }

  return res;
}
